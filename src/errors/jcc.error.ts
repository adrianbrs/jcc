import { IJCCReaderState } from "src/interfaces/jcc-reader.interface";

export interface JCCErrorOptions extends Partial<IJCCReaderState> {
  cause?: Error;
  details?: any;
}

export class JCCError extends Error implements JCCErrorOptions {
  filepath?: string | undefined;
  line?: number | undefined;
  column?: number | undefined;
  cause?: Error | undefined;
  encoding?: BufferEncoding | undefined;
  details?: any;

  constructor(message: string, options?: JCCErrorOptions) {
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
      ...(this.cause && { cause: this.cause }),
    };
  }
}
