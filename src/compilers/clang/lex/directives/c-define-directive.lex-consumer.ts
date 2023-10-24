import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { isLineBreak } from "@/helpers/string";
import { ICPreprocessorConstantFn } from "../interfaces/preprocessor-constants.interface";
import { ICLexConsumer, ICLexeme } from "../interfaces/lexeme.interface";

export class CDefineDirectiveLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let line = "";

    for await (const next of reader) {
      if (isLineBreak(next, line)) {
        break;
      }

      line += next;
    }

    return false;
  }
}
