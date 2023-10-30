import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "../interfaces/lexeme.interface.js";
import { isLineBreak } from "@/helpers/string.js";
import { JCCLogLevel } from "@/interfaces/jcc-logger.interface.js";

export class CIncludeDirectiveLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let line = "",
      header = "";
    let openTag = "",
      closeTag = "";

    for await (const next of reader) {
      if (isLineBreak(next)) {
        break;
      }
      if (!openTag) {
        if (next === "<" || next === '"') {
          openTag = next;
          continue;
        }
      } else {
        if (next === (openTag === "<" ? ">" : '"')) {
          header = line;
          closeTag = next;
          break;
        }

        line += next;
      }
    }

    const tagLength = openTag ? (openTag + closeTag).length : 0;

    if (!header) {
      reader.raise('#include expects "FILENAME" or <FILENAME>', {
        byteStart: reader.state.byte - (openTag ? tagLength - 1 : 0),
      });
    }

    reader.logger?.log(
      JCCLogLevel.WARN,
      reader.makeError("#include directive is not supported yet.", {
        byteStart: reader.state.byte - (line.length + tagLength - 1),
      })
    );

    return false;
  }
}
