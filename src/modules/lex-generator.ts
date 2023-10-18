import {
  IJCCLexGenerator,
  IJCCLexGeneratorOptions,
  IJCCLexeme,
} from "../interfaces/jcc-lex-generator.interface";

export class JCCLexGenerator<TLexeme extends IJCCLexeme = IJCCLexeme>
  implements IJCCLexGenerator<TLexeme>
{
  get reader() {
    return this._options.reader;
  }

  get consumer() {
    return this._options.consumer;
  }

  constructor(private readonly _options: IJCCLexGeneratorOptions<TLexeme>) {}

  next(): Promise<IteratorResult<TLexeme>> {
    return this.reader.next().then(async ({ done, value: char }) => {
      if (done) {
        return { done: true, value: null };
      }

      const lexeme = await this.consumer.consume(char, this.reader);

      return {
        done: false,
        value: lexeme,
      };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
