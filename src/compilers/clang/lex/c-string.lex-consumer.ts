import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { CLexemeType } from "./interfaces/lexeme-type.interface.js";
import { isLineBreak } from "@/helpers/string.js";

export class CStringLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let value = char;

    for await (const next of reader) {
      if (isLineBreak(next, value)) {
        reader.unshift(next);

        reader.raise(`missing terminating ${char} character`, {
          byteStart: reader.state.byte - (value.length - 1),
        });
      }

      value += next;

      if (next === char) {
        // Check if the quote is escaped
        if (value[value.length - 2] !== "\\") {
          break;
        }
      }
    }

    const type =
      char === "'" ? CLexemeType.CHAR_LITERAL : CLexemeType.STRING_LITERAL;

    // Deny empty char literals
    if (type === CLexemeType.CHAR_LITERAL && value.length <= 2) {
      reader.raise("empty character constant", {
        byteStart: reader.state.byte - 1,
      });
    }

    return {
      id: type,
      type,
      name: CLexemeType.getName(type),
      value,
    };
  }
}
