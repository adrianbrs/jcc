import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";
import {
  isDigit,
  isHexDigit,
  isLetter,
  isNumberSeparator,
  isNumberSign,
} from "@/helpers/string";

export const C_NUMBER_BASES = {
  b: 2,
  x: 16,
};

export type CNumberBase = keyof typeof C_NUMBER_BASES;

export function isCNumberBase(char: string): char is CNumberBase {
  return char in C_NUMBER_BASES;
}

export class CNumberLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<ICLexeme> {
    let number = char;
    let isFloat = isNumberSeparator(char);
    let base = char == "0" ? 8 : 0;

    for await (let next of reader) {
      next = next.toLowerCase();

      // OCTAL EDGE CASE
      if (!base && next === "0") {
        base = 8;
      }

      if (!base || base === 8) {
        if (next === "x") {
          base = 16;
        } else if (next === "b") {
          base = 2;
        }
      }

      // NORMAL DIGIT
      if (isDigit(next) || isLetter(next)) {
        // BASE VALIDATION
        if (base == 8 && next.charCodeAt(0) > "7".charCodeAt(0)) {
          reader.raise(`Invalid octal digit "${next}"`);
        } else if (base == 2 && next > "1") {
          reader.raise(`Invalid binary digit "${next}"`);
        } else if (base == 16 && !isDigit(next) && next.toLowerCase() > "f") {
          reader.raise(`Invalid hexadecimal digit "${next}"`);
        }

        // NUMBER BASE SEPARATOR
      } else if (isCNumberBase(next)) {
        if (base) {
          reader.raise(`Unexpected number base indicator "${next}"`);
        }
        base = C_NUMBER_BASES[next];

        // FLOAT SEPARATOR
      } else if (isNumberSeparator(next)) {
        if (isFloat) {
          reader.raise(`Unexpected number separator "${next}"`);
        }
        isFloat = true;
      } else {
        reader.unshift(next);
        break;
      }

      number += next;
    }

    const type = CLexemeType.NUMBER;
    return {
      type,
      id: type,
      value: number,
    };
  }
}
