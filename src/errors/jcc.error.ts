import { IJCCFileState } from "@/interfaces/file-state.interface";

export interface IJCCErrorOptions extends Partial<IJCCFileState> {
  /**
   * Selected range of bytes to highlight, counted relative to the current byte.\
   * Can be negative or positive.
   */
  selection?: number;
  cause?: Error;
  details?: any;
}

export class JCCError extends Error implements IJCCErrorOptions {
  filepath?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;
  cause?: Error | undefined;
  encoding?: BufferEncoding | undefined;
  details?: any;
  byte?: number | undefined;
  selection?: number | undefined;

  constructor(message: string, options?: IJCCErrorOptions) {
    super(message);
    this.name = this.constructor.name;

    if (options) {
      Object.assign(this, options);
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      filepath: this.filepath,
      ...(typeof this.encoding !== "undefined" && { encoding: this.encoding }),
      ...(typeof this.line !== "undefined" && { line: this.line }),
      ...(typeof this.column !== "undefined" && { column: this.column }),
      ...(typeof this.details !== "undefined" && { details: this.details }),
      ...(typeof this.selection !== "undefined" && {
        selection: this.selection,
      }),
      ...(typeof this.byte !== "undefined" && {
        bytesRead: this.byte,
      }),
      ...(this.cause && { cause: this.cause }),
    };
  }
}
