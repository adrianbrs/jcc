export enum JCCLogLevel {
  ERROR = "error",
  WARN = "warn",
  NOTE = "note",
  LOG = "log",
}

export interface IJCCLogger {
  log(level: JCCLogLevel, ...args: any[]): void | Promise<void>;
}
