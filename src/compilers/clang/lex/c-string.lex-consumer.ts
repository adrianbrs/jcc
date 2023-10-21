import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";

export class CStringLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let value = char;

    for await (const next of reader) {
      if (next === "\n") {
        reader.raise(`Missing closing quote ${JSON.stringify(char)}`, {
          selection: 1,
        });
      }

      value += next;

      if (next === char) {
        break;
      }
    }

    const type =
      char === "'" ? CLexemeType.CHAR_LITERAL : CLexemeType.STRING_LITERAL;

    // Deny empty char literals
    if (type === CLexemeType.CHAR_LITERAL && value.length <= 2) {
      reader.raise(`Empty char literal`, { selection: -1 });
    }

    return {
      id: type,
      type,
      name: CLexemeType.getName(type),
      value,
    };
  }
}
