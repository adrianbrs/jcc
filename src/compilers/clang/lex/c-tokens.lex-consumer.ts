import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { C_TOKENS } from "./tokens/tokens";
import { CLexemeType } from "./interfaces/lexeme-type.interface";

export class CTokensLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let tokenValue = char;

    while (true) {
      const next = await reader.next().then(({ value }) => value as string);

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
        selection: tokenValue.length,
      });
    }

    const type = CLexemeType.TOKEN;

    return {
      id: type + token.index,
      name: token.name,
      type,
      value: tokenValue,
    };
  }
}
