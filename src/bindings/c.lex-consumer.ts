import {
  isAlpha,
  isDigit,
  isNumberSeparator,
  isNumberSign,
} from "@/helpers/string";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { CWordLexConsumer } from "./c-word.lex-consumer";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CLexemeType } from "./interfaces/lexeme-type.interface";
import { CNumberLexConsumer } from "./c-number.lex-consumer";

export class CLexConsumer implements ICLexConsumer {
  wordConsumer = new CWordLexConsumer();
  numberConsumer = new CNumberLexConsumer();

  async consume(char: string, reader: IJCCReader): Promise<ICLexeme> {
    const next = await reader.peek();

    // WORD
    if (isAlpha(char)) {
      return this.wordConsumer.consume(char, reader);
    }

    // NUMBER
    if (
      isDigit(char) ||
      ((isNumberSign(char) || isNumberSeparator(char)) && isDigit(next))
    ) {
      return this.numberConsumer.consume(char, reader);
    }

    return {
      type: CLexemeType.TOKEN,
      id: CLexemeType.TOKEN,
      value: char,
    };
  }
}
