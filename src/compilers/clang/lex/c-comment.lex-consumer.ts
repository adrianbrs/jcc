import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";

export class CCommentLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let next = await reader.next().then(({ value }) => value as string);
    const multiline = next === "*";
    let prev = char;

    for await (next of reader) {
      if (multiline) {
        if (prev === "*" && next === "/") {
          break;
        }
      } else {
        if (next === "\n") {
          break;
        }
      }

      prev = next;
    }

    return false;
  }
}
