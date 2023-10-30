import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { CLexemeType } from "./interfaces/lexeme-type.interface.js";
import {
  isDigit,
  isLetter,
  isNumberSeparator,
  isNumberSign,
} from "@/helpers/string.js";

export class CNumberLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<ICLexeme> {
    let number = char;
    let decimalPointSeparators = isNumberSeparator(char) ? 1 : 0;
    let isScientificNotation = false;
    let prev = char;

    for await (let next of reader) {
      next = next.toLowerCase();

      // Check for scientific notation, e.g. 1e+10
      if (prev === "e" && isNumberSign(next) && !isScientificNotation) {
        isScientificNotation = true;
      } else if (isNumberSeparator(next)) {
        decimalPointSeparators++;
      } else if (!(isDigit(next) || isLetter(next))) {
        reader.unshift(next);
        break;
      }

      number += next;
      prev = next;
    }

    if (decimalPointSeparators > 1) {
      reader.raise("too many decimal points in number", {
        byteStart: reader.state.byte - (number.length - 1),
      });
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
