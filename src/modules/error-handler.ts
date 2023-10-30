import { IJCCLogger, JCCLogLevel } from "@/interfaces/jcc-logger.interface";

export interface IJCCErrorHandlerOptions {
  /**
   * The logger to use.
   *
   * @default JCCLogger
   */
  logger: IJCCLogger;

  /**
   * Whether to exit the process after handling the error.
   *
   * @default false
   */
  exit?: boolean;

  /**
   * Whether to rethrow the error after handling it.
   *
   * @default false
   */
  throw?: boolean;
}

export class JCCErrorHandler {
  get logger() {
    return this.options.logger;
  }

  constructor(readonly options: IJCCErrorHandlerOptions) {}

  async handle(err: unknown) {
    await this.logger.log(JCCLogLevel.ERROR, err);

    if (this.options.exit) {
      process.exit(1);
    } else if (this.options.throw) {
      if (err instanceof Error) {
        Error.captureStackTrace(err, JCCErrorHandler.prototype.handle);
      }
      throw err;
    }
  }
}
