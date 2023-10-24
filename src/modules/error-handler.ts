import { JCCError } from "@/errors/jcc.error";
import chalk, { Chalk, ChalkInstance } from "chalk";
import { createSupportsColor } from "supports-color";
import path from "path";
import util from "util";
import { createReadStream } from "fs";
import { createInterface } from "readline/promises";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";

export interface IJCCErrorHandlerOptions {
  /**
   * Whether to use colors in the output.
   *
   * @default true
   */
  colors?: boolean;

  /**
   * The stream to write the output to.
   *
   * @default process.stderr
   */
  stderr?: NodeJS.WriteStream;

  /**
   * Whether to throw the error after handling it.
   *
   * @default false
   */
  throw?: boolean;

  /**
   * Whether to exit the process after handling the error.
   *
   * @default false
   */
  exit?: boolean;

  /**
   * Depth to inspect error details.
   *
   * @default 3
   */
  depth?: number;

  /**
   * Current working directory to use in paths.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Display the line of code that caused the error.
   *
   * @default true
   */
  showCodeLine?: boolean;

  /**
   * Display stack trace of `JCCError` instances.
   *
   * @default false
   */
  showStackTrace?: boolean;

  /**
   * The reader instance to improve error messages.
   */
  reader?: IJCCReader | null;
}

export class JCCErrorHandler {
  readonly options: Required<Readonly<IJCCErrorHandlerOptions>>;

  private _chalk: ChalkInstance;

  get reader() {
    return this.options.reader;
  }

  constructor(options?: IJCCErrorHandlerOptions) {
    this.options = Object.freeze(
      Object.assign<
        Required<IJCCErrorHandlerOptions>,
        IJCCErrorHandlerOptions | undefined
      >(
        {
          colors: true,
          stderr: process.stderr,
          exit: false,
          throw: false,
          depth: 3,
          cwd: process.cwd(),
          showCodeLine: true,
          showStackTrace: false,
          reader: null,
        },
        options
      )
    );

    const supportsColor = createSupportsColor(this.options.stderr);
    this._chalk = new Chalk({
      level: this.options.colors && supportsColor ? supportsColor.level : 0,
    });
  }

  async handle(error: any) {
    if (this.options.stderr.writable) {
      const message = await this.format(error);
      this.options.stderr.write(message + "\n");

      if (this.options.exit) {
        process.exit(1);
      } else if (!this.options.throw) {
        return;
      }
    }
    throw error;
  }

  async format(error: any) {
    if (error instanceof JCCError) {
      const { message, stack, cause, details, state, line, column } = error;

      let msg = this._chalk.red.bold("error:") + " " + message;

      if (state) {
        const { filepath, encoding } = state;

        const relativePath = path.relative(this.options.cwd, filepath);

        msg =
          this._chalk.whiteBright.bold(
            `${relativePath}:${line ?? ""}:${column ?? ""}:`
          ) +
          " " +
          msg;

        if (encoding) {
          msg += this._chalk.dim(` (${encoding})`);
        }

        const codeFrame = await this._getCodeFrame(error);
        if (codeFrame) {
          msg += `\n${codeFrame}`;
        }
      }

      if (cause) {
        msg += `\ncause: ${this._chalk.dim(
          util.inspect(cause, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      if (stack && this.options.showStackTrace) {
        msg += `\n${this._chalk.dim(stack)}`;
      }

      if (details) {
        msg += `\n${this._chalk.dim(
          util.inspect(details, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      return msg;
    }

    if (error instanceof Error) {
      const { name, message, stack, ...details } = error;
      let msg = this._chalk.red(
        `${this._chalk.bold(name)}: ${message}\n${this._chalk.dim(stack)}`
      );

      if (Object.keys(details).length) {
        msg += `\n${this._chalk.dim(
          util.inspect(details, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      return msg;
    }

    return this._chalk.red(`Unknown error: ${error}`);
  }

  private async _readLines(
    filepath: string,
    byteStart: number,
    byteEnd: number,
    encoding?: BufferEncoding
  ): Promise<string[]> {
    const readable = createReadStream(filepath, {
      start: byteStart,
      encoding,
    });

    return new Promise<string[]>((_resolve, _reject) => {
      const lines: string[] = [];
      let ended = false;
      let line = "";
      let chunk: string | null = null;
      let maxLength = byteEnd - byteStart;

      const onReadable = () => {
        while (null !== (chunk = readable.read(1))) {
          maxLength--;
          line += chunk;

          if (chunk === "\n") {
            lines.push(line);
            line = "";

            if (maxLength <= 0) {
              readable.destroy();
              break;
            }
          }
        }
      };

      const resolve = () => {
        if (!ended) {
          cleanup();
          _resolve(lines);
        }
      };

      const reject = (err: any) => {
        if (!ended) {
          cleanup();
          _reject(err);
        }
      };

      const cleanup = () => {
        ended = true;
        readable.off("readable", onReadable);
        readable.off("end", resolve);
        readable.off("close", resolve);
        readable.off("error", reject);
      };

      readable.on("readable", onReadable);
      readable.once("end", resolve);
      readable.once("close", resolve);
      readable.once("error", reject);
    }).finally(() => {
      readable.destroy();
    });
  }

  private async _getCodeFrame(error: JCCError) {
    if (!this.options.showCodeLine) {
      return null;
    }

    const { byteStart, byteEnd, state } = error;

    if (
      !(
        this.reader &&
        state &&
        typeof byteStart !== "undefined" &&
        typeof byteEnd !== "undefined"
      )
    ) {
      return null;
    }

    const { filepath, encoding } = state;
    const lineStart = this.reader.getLineFromByte(byteStart);
    const startOfLineByte = this.reader.getByte(lineStart);

    try {
      const rawLines = await this._readLines(
        filepath,
        startOfLineByte,
        byteEnd,
        encoding
      );

      const frames: string[] = [];
      let byteCount = startOfLineByte;
      let lineCount = lineStart;

      for (const line of rawLines) {
        const prefix = `${lineCount}`;
        let frame = this._chalk.dim(prefix + " | ");
        let underline = this._chalk.dim(" ".repeat(prefix.length) + " | ");

        for (const char of line.split("")) {
          byteCount++;

          // Build frame
          if (char !== "\n") {
            if (byteCount >= byteStart && byteCount <= byteEnd) {
              frame += this._chalk.redBright.bold(char);
            } else {
              frame += char;
            }

            // Build underline
            if (byteCount === byteStart) {
              underline += this._chalk.redBright.bold("^");
            } else if (byteCount >= byteStart && byteCount <= byteEnd) {
              underline += this._chalk.redBright.bold("~");
            } else {
              underline += " ";
            }
          }
        }

        frames.push(frame, underline);
        lineCount++;
      }

      return frames.join("\n");

      // const frames = rawLines.reduce((frames, line, i) => {
      //   const frame = line.split("").reduce((frame, char, j) => {
      //     const byte = startOfLineByte + i ;

      //     if (
      //       li >= lineStart &&
      //       li <= lineEnd &&
      //       ci >= columnStart &&
      //       ci <= columnEnd
      //     ) {
      //       frame += this._chalk.redBright.bold(char);
      //     } else {
      //       frame += char;
      //     }

      //     return frame;
      //   }, "");

      //   const underline = line.split("").reduce((underline, _, i) => {
      //     if (li === lineStart && ci === columnStart) {
      //       underline += this._chalk.redBright.bold("^");
      //     } else if (
      //       li >= lineStart &&
      //       li <= lineEnd &&
      //       ci >= columnStart &&
      //       ci <= columnEnd
      //     ) {
      //       underline += this._chalk.redBright.bold("~");
      //     } else {
      //       underline += " ";
      //     }

      //     return underline;
      //   }, "");

      //   console.log(frame, underline);

      //   return frames.concat([frame, underline]);
      // }, [] as string[]);

      // return frames.join("\n");
      // const highlightColStart = Math.max(0, colNum + highlightOffsetStart - 1);
      // const highlightColEnd = colNum + highlightOffsetEnd - 1;

      // Colorize line errors
      // let frame = rawLines.split("").reduce((frame, char, i) => {
      //   const col = i + 1;

      //   if (col >= highlightColStart && col <= highlightColEnd) {
      //     frame += this._chalk.redBright.bold(char);
      //   } else {
      //     frame += char;
      //   }

      //   return frame;
      // }, "");

      // // Create underline highlight
      // let underline = rawLines.split("").reduce((frame, _, i) => {
      //   const col = i + 1;

      //   if (col === highlightColStart) {
      //     frame += this._chalk.redBright.bold("^");
      //   } else if (col >= highlightColStart && col <= highlightColEnd) {
      //     frame += this._chalk.redBright.bold("~");
      //   } else {
      //     frame += " ";
      //   }

      //   return frame;
      // }, "");

      // // Add line number
      // if (lineNum) {
      //   const lineInfo = `${lineNum} | `;
      //   frame = this._chalk.dim(lineInfo) + frame;
      //   underline = " ".repeat(lineInfo.length) + underline;
      // }

      return null;
      // return [frame, underline].join("\n");
    } catch (err) {}

    return null;
  }
}
