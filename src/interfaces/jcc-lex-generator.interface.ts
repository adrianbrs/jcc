import { IJCCReader } from "./jcc-reader.interface";

export interface IJCCLexConsumer {
  /**
   * Consumes characters from the reader to produce a lexeme.
   */
  consume(char: string, reader: IJCCReader): IJCCLexeme | Promise<IJCCLexeme>;
}

export interface IJCCLexGeneratorOptions {
  reader: IJCCReader;
  consumer: IJCCLexConsumer;
}

export interface IJCCLexeme {
  value: string;
}

export interface IJCCLexGenerator extends AsyncIterableIterator<IJCCLexeme> {}
