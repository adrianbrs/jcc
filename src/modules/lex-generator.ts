import {
  IJCCLexGenerator,
  IJCCLexGeneratorOptions,
  IJCCLexeme,
} from "../interfaces/jcc-lex-generator.interface";

export class JCCLexGenerator implements IJCCLexGenerator {
  get reader() {
    return this._options.reader;
  }

  get consumer() {
    return this._options.consumer;
  }

  constructor(private readonly _options: IJCCLexGeneratorOptions) {}

  next(): Promise<IteratorResult<IJCCLexeme>> {
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
