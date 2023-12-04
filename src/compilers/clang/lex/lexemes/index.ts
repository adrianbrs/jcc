import { JCCError } from "@/errors/jcc.error.js";
import { CLexemeType } from "../interfaces/lexeme-type.interface.js";
import { ICLexeme } from "../interfaces/lexeme.interface.js";
import { C_KEYWORDS } from "./keywords.js";
import { C_TOKENS } from "./tokens.js";

export function getLexeme(id: number): ICLexeme | null {
  switch (id) {
    case CLexemeType.IDENTIFIER:
    case CLexemeType.NUMBER_LITERAL:
    case CLexemeType.STRING_LITERAL:
    case CLexemeType.CHAR_LITERAL:
      return {
        id,
        type: id,
        name: CLexemeType.getName(id),
        value: CLexemeType.getName(id),
      };
    default:
      const token = C_KEYWORDS.getById(id) ?? C_TOKENS.getById(id);
      if (!token) {
        return null;
      }
      return {
        ...token,
      };
  }
}
