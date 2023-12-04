import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { ICSintDeclaration } from "./declaration.interface.js";

export interface ICSintFunctionDefinition {
  declaration: ICSintDeclaration;
  body?: JCCDictRule<ICLexeme>;
}
