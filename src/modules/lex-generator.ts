import EventEmitter from "events";
import {
  IJCCLexGenerator,
  IJCCLexGeneratorOptions,
  IJCCLexeme,
} from "../interfaces/jcc-lex-generator.interface";

export class JCCLexGenerator<TLexeme extends IJCCLexeme = IJCCLexeme>
  extends EventEmitter
  implements IJCCLexGenerator<TLexeme>
{
  get reader() {
    return this.options.reader;
  }

  get consumer() {
    return this.options.consumer;
  }

  get stopOnError() {
    return this.options.stopOnError;
  }

  constructor(readonly options: IJCCLexGeneratorOptions<TLexeme>) {
    super();
  }

  next(): Promise<IteratorResult<TLexeme>> {
    return this.reader.next().then(async ({ done, value: char }) => {
      if (done) {
        return { done: true, value: null };
      }

      const lexeme = await Promise.resolve(
        this.consumer.consume(char, this.reader)
      ).catch((err) => {
        if (this.stopOnError) {
          throw err;
        }

        this.emit("error", err);

        return null;
      });

      if (!lexeme) {
        return this.next();
      }

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
