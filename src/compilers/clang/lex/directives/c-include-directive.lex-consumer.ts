import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "../interfaces/lexeme.interface";
import { isLineBreak } from "@/helpers/string";

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

    if (!header) {
      reader.raise('#include expects "FILENAME" or <FILENAME>', {
        byteStart:
          reader.state.byte - (openTag ? (openTag + closeTag).length - 1 : 0),
      });
    }

    return false;
  }
}
