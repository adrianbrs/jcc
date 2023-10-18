import { IJCCReader } from "./jcc-reader.interface";

export interface IJCCLexConsumer<TLexeme extends IJCCLexeme = IJCCLexeme> {
  /**
   * Consumes characters from the reader to produce a lexeme.
   */
  consume(
    char: string,
    reader: IJCCReader
  ): TLexeme | false | Promise<TLexeme | false>;
}

export interface IJCCLexGeneratorOptions<
  TLexeme extends IJCCLexeme = IJCCLexeme
> {
  reader: IJCCReader;
  consumer: IJCCLexConsumer<TLexeme>;
}

export interface IJCCLexeme {
  id: number;
  value: string;
}

export interface IJCCLexGenerator<TLexeme extends IJCCLexeme = IJCCLexeme>
  extends AsyncIterableIterator<TLexeme> {}
