import { IJCCReader } from "./jcc-reader.interface.js";

export interface IJCCLexConsumer<R = IJCCLexeme> {
  /**
   * Consumes characters from the reader to produce a lexeme.
   */
  consume(char: string, reader: IJCCReader): R | false | Promise<R | false>;
}

export interface IJCCLexGeneratorOptions<
  TLexeme extends IJCCLexeme = IJCCLexeme
> {
  reader: IJCCReader;
  consumer: IJCCLexConsumer<TLexeme>;
  stopOnError?: boolean;
}

export interface IJCCLexeme {
  value: string;
}

export interface IJCCLexGenerator<TLexeme extends IJCCLexeme = IJCCLexeme>
  extends AsyncIterableIterator<TLexeme> {
  readonly options: Readonly<IJCCLexGeneratorOptions>;
}
