import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { C_TOKENS } from "./lexemes/tokens.js";

export class CTokensLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let tokenValue = char;

    for await (const next of reader) {
      if (C_TOKENS.hasPrefix(tokenValue + next)) {
        tokenValue += next;
        continue;
      }

      reader.unshift(next);
      break;
    }

    const token = C_TOKENS.get(tokenValue);

    if (!token) {
      reader.raise(`Unexpected token: ${tokenValue}`, {
        byteStart: reader.state.byte - (tokenValue.length - 1),
      });
    }

    return {
      ...token,
      value: tokenValue,
    };
  }
}
