import {
  IJCCLexGenerator,
  IJCCLexGeneratorOptions,
  IJCCLexeme,
} from "../interfaces/jcc-lex-generator.interface";

export class JCCLexGenerator implements IJCCLexGenerator {
  private get _reader() {
    return this._options.reader;
  }

  constructor(private readonly _options: IJCCLexGeneratorOptions) {}

  next(): Promise<IteratorResult<IJCCLexeme>> {
    return this._reader.next().then(({ done, value }) => {
      if (done) {
        return { done: true, value: null };
      }

      return {
        done: false,
        value: {
          value,
        },
      };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
