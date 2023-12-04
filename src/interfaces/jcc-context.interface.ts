import { IJCCFileState } from "./jcc-file-state.interface.js";
import { IJCCLexeme } from "./jcc-lex-generator.interface.js";
import { IJCCReader } from "./jcc-reader.interface.js";

export interface IJCCContext<T extends IJCCLexeme = IJCCLexeme> {
  readonly id: number;
  readonly state: IJCCFileState;
  readonly reader: IJCCReader;

  fork(): IJCCContext<T>;
  exit(): IJCCContext<T> | null;
  prev(): IJCCContext<T> | null;
  getCurrentFunction(): T | null;
}
