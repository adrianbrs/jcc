import { isAlphaNumeric } from "@/helpers/string.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { CLexemeType } from "./interfaces/lexeme-type.interface.js";
import { C_KEYWORDS } from "./lexemes/keywords.js";
import { ICPreprocessorConstantMap } from "./interfaces/preprocessor-constants.interface.js";

export class CWordLexConsumer implements ICLexConsumer {
  #variableKeyMap = new Map<string, number>();

  constructor(readonly constants: ICPreprocessorConstantMap) {}

  getVariableKey(name: string) {
    if (!this.#variableKeyMap.has(name)) {
      this.#variableKeyMap.set(name, this.#variableKeyMap.size);
    }
    return this.#variableKeyMap.get(name)!;
  }

  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let word = char;

    for await (const next of reader) {
      if (isAlphaNumeric(next)) {
        word += next;
      } else {
        reader.unshift(next);
        break;
      }
    }

    // KEYWORD
    if (C_KEYWORDS.has(word)) {
      const token = C_KEYWORDS.get(word);

      return {
        ...token,
        value: word,
      };
    }

    // CONSTANT
    if (this.constants.has(word)) {
      const fn = this.constants.get(word)!;
      await fn(reader);
      return false;
    }

    // IDENTIFIER
    const type = CLexemeType.IDENTIFIER;
    return {
      id: type,
      name: CLexemeType.getName(type),
      type,
      key: this.getVariableKey(word),
      value: word,
    };
  }
}
