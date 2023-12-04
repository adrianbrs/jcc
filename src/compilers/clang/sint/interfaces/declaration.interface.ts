import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";

export enum ICSintDeclarationKind {
  VARIABLE,
  FUNCTION,
}

export interface ICSintDeclaration {
  type: JCCDictRule<ICLexeme>;
  identifier: ICLexeme;
  kind: ICSintDeclarationKind;
  assignment: JCCDictRule<ICLexeme> | null;
}
