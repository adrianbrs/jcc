import {
  isAlpha,
  isDigit,
  isNumberSeparator,
  isWhitespace,
} from "@/helpers/string.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { CWordLexConsumer } from "./c-word.lex-consumer.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { CNumberLexConsumer } from "./c-number.lex-consumer.js";
import { CTokensLexConsumer } from "./c-tokens.lex-consumer.js";
import { CCommentLexConsumer } from "./c-comment.lex-consumer.js";
import { C_TOKENS } from "./tokens/tokens.js";
import { CDirectivesLexConsumer } from "./c-directives.lex-consumer.js";
import { CStringLexConsumer } from "./c-string.lex-consumer.js";
import { ICPreprocessorConstantMap } from "./interfaces/preprocessor-constants.interface.js";

export class CLexConsumer implements ICLexConsumer {
  constants: ICPreprocessorConstantMap = new Map();

  directivesConsumer = new CDirectivesLexConsumer(this.constants);
  wordConsumer = new CWordLexConsumer(this.constants);
  numberConsumer = new CNumberLexConsumer();
  commentConsumer = new CCommentLexConsumer();
  tokensConsumer = new CTokensLexConsumer();
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
