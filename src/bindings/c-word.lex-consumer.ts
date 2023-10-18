import { isAlpha, isAlphaNumeric } from "@/helpers/string";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";
import { C_KEYWORDS, isCKeyword } from "./keywords";

export class CWordLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<ICLexeme> {
    let word = char;

    for await (const next of reader) {
      if (isAlphaNumeric(next)) {
        word += next;
      } else {
        reader.unshift(next);
        break;
      }
    }

    // KEYWORD
    if (isCKeyword(word)) {
      const type = CLexemeType.KEYWORD;
      return {
        id: type + C_KEYWORDS[word],
        type,
        value: word,
      };
    }

    // IDENTIFIER
    const type = CLexemeType.IDENTIFIER;
    return {
      id: type,
      type,
      value: word,
    };
  }
}
