import { IJCCCompiler } from "./jcc-compiler.interface";
import { IJCCModule } from "./jcc-module.interface";

export enum JCCLogLevel {
  ERROR = "error",
  WARN = "warn",
  NOTE = "note",
  LOG = "log",
}

export interface IJCCLogger<TCompiler extends IJCCCompiler = IJCCCompiler>
  extends IJCCModule<TCompiler> {
  log(level: JCCLogLevel, ...args: any[]): void | Promise<void>;
}
