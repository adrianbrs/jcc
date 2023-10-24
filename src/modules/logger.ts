import { JCCError } from "@/errors/jcc.error";
import { Chalk, ChalkInstance } from "chalk";
import { createSupportsColor } from "supports-color";
import { createReadStream } from "fs";
import { IJCCLogger, JCCLogLevel } from "@/interfaces/jcc-logger.interface";
import { IJCCCompiler } from "@/interfaces/jcc-compiler.interface";
import path from "path";
import util from "util";
import { readLineRange } from "@/helpers/readline";

export interface IJCCLoggerOptions {
  /**
   * Whether to use colors in the output.
   *
   * @default true
   */
  colors?: boolean;

  /**
   * The stream to write log messages to.
   *
   * @default process.stdout
   */
  stdout?: NodeJS.WriteStream;

  /**
   * The stream to write error and warnings messages to.
   *
   * @default process.stderr
   */
  stderr?: NodeJS.WriteStream;

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
   * Display the lines of code that caused the error.
   *
   * @default true
   */
  showCodeLines?: boolean;

  /**
   * Display stack trace of `JCCError` instances.
   *
   * @default false
   */
  showStackTrace?: boolean;

  /**
   * Log levels to be considered as errors.
   *
   * @default ["error", "warn"]
   */
  errorLogLevels?: JCCLogLevel[];
}

export class JCCLogger<TCompiler extends IJCCCompiler = IJCCCompiler>
  implements IJCCLogger
{
  static LEVEL_COLORS: Record<
    JCCLogLevel,
    (chalk: ChalkInstance) => ChalkInstance
  > = {
    error: (c) => c.red,
    log: (c) => c.white,
    warn: (c) => c.yellow,
    note: (c) => c.blue,
  };

  readonly options: Required<Readonly<IJCCLoggerOptions>>;

  #errorLevels = new Set<JCCLogLevel>();
  #chalk: ChalkInstance;

  constructor(readonly compiler: IJCCCompiler, options?: IJCCLoggerOptions) {
    this.options = Object.freeze(
      Object.assign<Required<IJCCLoggerOptions>, IJCCLoggerOptions | undefined>(
        {
          colors: true,
          stdout: process.stdout,
          stderr: process.stderr,
          depth: 3,
          cwd: process.cwd(),
          showCodeLines: true,
          showStackTrace: false,
          errorLogLevels: [JCCLogLevel.ERROR, JCCLogLevel.WARN],
        },
        options
      )
    );

    const supportsColor = createSupportsColor(this.options.stderr);
    this.#chalk = new Chalk({
      level: this.options.colors && supportsColor ? supportsColor.level : 0,
    });

    for (const level of this.options.errorLogLevels) {
      this.#errorLevels.add(level);
    }
  }

  getColor(level: JCCLogLevel) {
    return JCCLogger.LEVEL_COLORS[level]?.(this.#chalk) ?? this.#chalk;
  }

  async log(level: JCCLogLevel, ...args: any[]) {
    const message = args.map((arg) => this.format(arg)).join(" ");
    const stream = this.#errorLevels.has(level)
      ? this.options.stderr
      : this.options.stdout;
    stream.write(message);
  }

  async format(arg: any): Promise<string> {
    let state = this.compiler.state;
    let message: string | null = null;

    if (arg instanceof JCCError || arg instanceof Error) {
      message = await this.formatError(arg);

      if (arg instanceof JCCError && arg.state) {
        state = arg.state;
      }
    } else if (typeof arg === "string") {
      message = arg;
    } else {
      message = util.inspect(arg, {
        colors: this.options.colors,
        depth: this.options.depth,
      });
    }

    const relativePath = path.relative(this.options.cwd, state.filepath);

    message =
      this.#chalk.whiteBright.bold(
        `${relativePath}:${state.line ?? ""}:${state.column ?? ""}:`
      ) +
      " " +
      message;

    if (state.encoding) {
      message += this.#chalk.dim(` (${state.encoding})`);
    }

    return message;
  }

  async formatError(error: JCCError | Error): Promise<string> {
    if (error instanceof JCCError) {
      const { message, stack, cause, details } = error;

      let msg = message;

      const codeFrame = await this.getErrorFrame(error);
      if (codeFrame) {
        msg += `\n${codeFrame}`;
      }

      if (cause) {
        msg += `\ncause: ${this.#chalk.dim(
          util.inspect(cause, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      if (stack && this.options.showStackTrace) {
        msg += `\n${this.#chalk.dim(stack)}`;
      }

      if (details) {
        msg += `\n${this.#chalk.dim(
          util.inspect(details, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      return msg;
    } else {
      const { name, message, stack, ...details } = error;

      let msg = this.#chalk.red.bold(name) + ": " + message;

      if (stack) {
        msg += `\n${this.#chalk.dim(stack)}`;
      }

      if (Object.keys(details).length) {
        msg += `\n${this.#chalk.dim(
          util.inspect(details, {
            colors: this.options.colors,
            depth: this.options.depth,
          })
        )}`;
      }

      return msg;
    }
  }

  private async getErrorFrame(error: JCCError) {
    if (!this.options.showCodeLines) {
      return null;
    }

    const { byteStart, byteEnd, state } = error;

    if (
      !(
        state &&
        typeof byteStart !== "undefined" &&
        typeof byteEnd !== "undefined"
      )
    ) {
      return null;
    }

    const reader = this.compiler.reader;
    const { filepath, encoding } = state;
    const lineStart = reader.getLineFromByte(byteStart);
    const startOfLineByte = reader.getByte(lineStart);

    try {
      const rawLines = await readLineRange(
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
        let frame = this.#chalk.dim(prefix + " | ");
        let underline = this.#chalk.dim(" ".repeat(prefix.length) + " | ");

        for (const char of line.split("")) {
          byteCount++;

          if (char !== "\n") {
            // Build frame
            if (byteCount >= byteStart && byteCount <= byteEnd) {
              frame += this.#chalk.redBright.bold(char);
            } else {
              frame += char;
            }
          }

          // Build underline
          if (byteCount === byteStart) {
            underline += this.#chalk.redBright.bold("^");
          } else if (byteCount >= byteStart && byteCount <= byteEnd) {
            underline += this.#chalk.redBright.bold("~");
          } else {
            underline += " ";
          }
        }

        frames.push(frame, underline);
        lineCount++;
      }

      return frames.join("\n");
    } catch (err) {}

    return null;
  }
}
