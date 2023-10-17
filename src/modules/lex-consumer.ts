import {
  IJCCLexConsumer,
  IJCCLexeme,
} from "@/interfaces/jcc-lex-generator.interface";
import { IJCCReader } from "@/interfaces/jcc-reader.interface";

export class JCCLexConsumer implements IJCCLexConsumer {
  consume(char: string, reader: IJCCReader): IJCCLexeme | Promise<IJCCLexeme> {
    console.log(reader.state.line, reader.state.column);

    return {
      value: char,
    };
  }
}
