import {
  isAlpha,
  isDigit,
  isNumberSeparator,
  isWhitespace,
} from "@/helpers/string";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { CWordLexConsumer } from "./c-word.lex-consumer";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CNumberLexConsumer } from "./c-number.lex-consumer";
import { CTokensLexConsumer } from "./c-tokens.lex-consumer";
import { CCommentLexConsumer } from "./c-comment.lex-consumer";
import { C_TOKENS } from "./tokens/tokens";
import { CDirectivesLexConsumer } from "./c-directives.lex-consumer";
import { CStringLexConsumer } from "./c-string.lex-consumer";

export class CLexConsumer implements ICLexConsumer {
  wordConsumer = new CWordLexConsumer();
  numberConsumer = new CNumberLexConsumer();
  commentConsumer = new CCommentLexConsumer();
  tokensConsumer = new CTokensLexConsumer();
  directivesConsumer = new CDirectivesLexConsumer();
  stringConsumer = new CStringLexConsumer();

  async consume(char: string, reader: IJCCReader): Promise<ICLexeme | false> {
    const next = await reader.peek();

    // COMMENT
    if (char === "/" && (next === "/" || next === "*")) {
      return this.commentConsumer.consume(char, reader);
    }

    // STRING
    if (char === '"' || char === "'") {
      return this.stringConsumer.consume(char, reader);
    }

    // WORD
    if (isAlpha(char)) {
      return this.wordConsumer.consume(char, reader);
    }

    // NUMBER
    if (isDigit(char) || (isNumberSeparator(char) && isDigit(next))) {
      return this.numberConsumer.consume(char, reader);
    }

    // TOKENS
    if (C_TOKENS.hasPrefix(char)) {
      return this.tokensConsumer.consume(char, reader);
    }

    // DIRECTIVES
    if (char === "#") {
      return this.directivesConsumer.consume(char, reader);
    }

    // IGNORE EXTRA WHITESPACES
    if (isWhitespace(char)) {
      return false;
    }

    reader.raise(`Unexpected token: ${char}`);
  }
}
