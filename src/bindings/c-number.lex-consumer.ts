import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";
import {
  isDigit,
  isLetter,
  isNumberSeparator,
  isNumberSign,
} from "@/helpers/string";

export class CNumberLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<ICLexeme> {
    let number = char;
    let isFloat = isNumberSeparator(char);
    let isScientificNotation = false;
    let prev = char;

    for await (let next of reader) {
      next = next.toLowerCase();

      // Check for scientific notation, e.g. 1e+10
      if (prev === "e" && isNumberSign(next) && !isScientificNotation) {
        isScientificNotation = true;
      } else if (isNumberSeparator(next)) {
        if (isFloat) {
          reader.raise(`Too many floating point separator "${next}"`);
        }
        isFloat = true;
      } else if (!(isDigit(next) || isLetter(next))) {
        reader.unshift(next);
        break;
      }

      number += next;
      prev = next;
    }

    const type = CLexemeType.NUMBER_LITERAL;
    return {
      type,
      id: type,
      name: CLexemeType.getName(type),
      value: number,
    };
  }
}
