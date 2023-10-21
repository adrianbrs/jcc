import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";

export class CDirectivesLexConsumer implements ICLexConsumer {
  async consume(char: string, reader: IJCCReader): Promise<false | ICLexeme> {
    for await (const next of reader) {
      if (next === "\n") {
        break;
      }
    }

    // TODO: Implement directives
    return false;
  }
}
