import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";

export interface IJCCErrorOptions {
  state?: IJCCFileState;
  /**
   * Selected range of bytes to highlight, counted relative to the current byte.\
   * Can be negative or positive.
   */
  cause?: Error;
  details?: any;

  /**
   * Line that raised the error.
   *
   * @default state.line
   */
  line?: number;

  /**
   * Column that raised the error.
   *
   * @default state.column
   */
  column?: number;

  /**
   * Start byte of the selection.
   *
   * @default state.byte
   */
  byteStart?: number;

  /**
   * End byte of the selection.
   *
   * @default state.byte
   */
  byteEnd?: number;

  /**
   * Selected lexemes to highlight.
   */
  lexemes?: IJCCLexeme[];
}

export class JCCError extends Error implements IJCCErrorOptions {
  cause?: Error;
  details?: any;
  selection!: number;
  state?: IJCCFileState;
  byteStart?: number;
  byteEnd?: number;
  line?: number;
  column?: number;
  lexemes?: IJCCLexeme[];

  constructor(message: string, options?: IJCCErrorOptions) {
    super(message);
    this.name = this.constructor.name;

    if (options) {
      let byteStart: number | undefined;
      let byteEnd: number | undefined;

      if (options.lexemes?.length) {
        for (const lexeme of options.lexemes) {
          if (typeof lexeme.byteStart !== "undefined") {
            byteStart = Math.min(
              byteStart ?? lexeme.byteStart,
              lexeme.byteStart
            );
          }
          if (typeof lexeme.byteEnd !== "undefined") {
            byteEnd = Math.max(byteEnd ?? lexeme.byteEnd, lexeme.byteEnd);
          }
        }
      }

      byteStart ??= options.state?.byte;
      byteEnd ??= options.state?.byte;

      Object.assign<this, Partial<IJCCErrorOptions>, IJCCErrorOptions>(
        this,
        {
          line: options.state?.line,
          column: options.state?.column,
          byteStart,
          byteEnd,
        },
        options
      );
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      ...(this.state && {
        state: this.state,
      }),
      ...(typeof this.selection !== "undefined" && {
        selection: this.selection,
      }),
      ...(typeof this.byteStart !== "undefined" && {
        byteStart: this.byteStart,
      }),
      ...(typeof this.byteEnd !== "undefined" && { byteEnd: this.byteEnd }),
      ...(typeof this.line !== "undefined" && { line: this.line }),
      ...(typeof this.column !== "undefined" && { column: this.column }),
      ...(this.details && { details: this.details }),
      ...(this.cause && { cause: this.cause }),
    };
  }
}
