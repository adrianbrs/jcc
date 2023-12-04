import { JCCDictRule } from "@/modules/dict.js";
import { IJCCFileState } from "./jcc-file-state.interface.js";
import { IJCCLexeme } from "./jcc-lex-generator.interface.js";
import { IJCCReader } from "./jcc-reader.interface.js";

export interface IJCCContext<T extends IJCCLexeme> {
  readonly id: number;
  readonly state: IJCCFileState;
  readonly reader: IJCCReader;
  readonly stack: (T | JCCDictRule<T>)[];

  fork(): IJCCContext<T>;
  exit(): IJCCContext<T> | null;
  prev(): IJCCContext<T> | null;
}
