import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { isLineBreak } from "@/helpers/string.js";
import { ICPreprocessorConstantFn } from "../interfaces/preprocessor-constants.interface.js";
import { ICLexConsumer, ICLexeme } from "../interfaces/lexeme.interface.js";
import { JCCLogLevel } from "@/interfaces/jcc-logger.interface.js";

export class CDefineDirectiveLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let line = "";

    for await (const next of reader) {
      if (isLineBreak(next, line)) {
        break;
      }

      line += next;
    }

    reader.logger?.log(
      JCCLogLevel.WARN,
      reader.makeError("#define directive is not supported yet.", {
        byteStart: reader.state.byte - (line.length - 1),
      })
    );

    return false;
  }
}
