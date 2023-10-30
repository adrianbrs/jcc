export enum JCCLogLevel {
  ERROR = 0,
  WARN = 1,
  NOTE = 2,
  LOG = 3,
}

export interface IJCCLogger {
  log(level: JCCLogLevel, ...args: any[]): void | Promise<void>;
}
