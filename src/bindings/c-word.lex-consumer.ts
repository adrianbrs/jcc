import { isAlphaNumeric } from "@/helpers/string";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";
import { C_KEYWORDS } from "./tokens/keywords";

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
    if (C_KEYWORDS.has(word)) {
      const type = CLexemeType.KEYWORD;
      const token = C_KEYWORDS.get(word);

      return {
        id: type + token.index,
        name: token.name,
        type,
        value: word,
      };
    }

    // IDENTIFIER
    const type = CLexemeType.IDENTIFIER;
    return {
      id: type,
      name: CLexemeType.getName(type),
      type,
      value: word,
    };
  }
}
