import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";

export interface ICSintWorker {
  use(rule: JCCDictRule<ICLexeme>): boolean;
}
