import { JCCError } from "@/errors/jcc.error";
import { Chalk, ChalkInstance } from "chalk";
import { createSupportsColor } from "supports-color";
import path from "path";
import util from "util";
import { createReadStream } from "fs";

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
   * Size of the code frame to display.
   *
   * @default 255
   */
  codeFrameSize?: number;
}

export class JCCErrorHandler {
  readonly options: Required<Readonly<IJCCErrorHandlerOptions>>;

  private _chalk: ChalkInstance;

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
          codeFrameSize: 255,
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
      const {
        message,
        stack,
        filepath,
        line = 0,
        column = 0,
        cause,
        details,
        encoding,
      } = error;

      let msg = this._chalk.red(this._chalk.bold("[JCC Error] ") + message);

      if (filepath) {
        const relativePath = path.relative(this.options.cwd, filepath);
        msg += this._chalk.red(
          " in " + this._chalk.italic(`${relativePath}:${line}:${column}`)
        );

        if (encoding) {
          msg += this._chalk.dim(` (${encoding})`);
        }
      }

      const codeFrame = await this._getCodeFrame(error);
      if (codeFrame) {
        msg += `\n${codeFrame}`;
      }

      if (cause) {
        msg += `\nCause: ${this._chalk.dim(
          util.inspect(cause, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      if (stack) {
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

  private async _getCodeFrame(error: JCCError) {
    if (this.options.codeFrameSize <= 0) {
      return null;
    }

    const { filepath, byte, encoding, selection = 0 } = error;

    if (filepath && typeof byte !== "undefined") {
      try {
        const offsetStart = Math.floor(this.options.codeFrameSize / 2);
        const offsetEnd = this.options.codeFrameSize - offsetStart;
        const start = Math.max(0, byte - offsetStart);
        const end = byte + offsetEnd;

        const readStream = createReadStream(filepath, {
          start,
          end,
          encoding,
        });

        const frame = await new Promise((resolve, reject) => {
          let frame = "";
          let highlightByteStart = byte + (selection < 0 ? selection : 0);
          let highlightByteEnd = byte + (selection > 0 ? selection : 0);
          let currentByte = start;

          readStream.on("readable", () => {
            let chunk: string;
            while (null !== (chunk = readStream.read(1))) {
              currentByte++;

              if (
                currentByte >= highlightByteStart &&
                currentByte <= highlightByteEnd
              ) {
                frame += this._chalk.bgRedBright(chunk);
              } else {
                frame += chunk;
              }
            }
          });

          readStream.on("end", () => {
            resolve(frame);
          });

          readStream.on("error", (err) => {
            reject(err);
          });
        });

        return frame;
      } catch {}
    }

    return null;
  }
}
