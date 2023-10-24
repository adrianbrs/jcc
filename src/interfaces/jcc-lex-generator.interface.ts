import { IJCCCompiler, IJCCCompilerTypes } from "./jcc-compiler.interface";
import { IJCCModule } from "./jcc-module.interface";
import { IJCCReader } from "./jcc-reader.interface";

export interface IJCCLexConsumer<R = IJCCLexeme> {
  /**
   * Consumes characters from the reader to produce a lexeme.
   */
  consume(char: string, reader: IJCCReader): R | false | Promise<R | false>;
}

export interface IJCCLexGeneratorOptions<
  TCompiler extends IJCCCompiler = IJCCCompiler
> {
  consumer: IJCCLexConsumer<IJCCCompilerTypes<TCompiler>["lexeme"]>;
  stopOnError?: boolean;
}

export interface IJCCLexeme {
  value: string;
}

export interface IJCCLexGenerator<TCompiler extends IJCCCompiler = IJCCCompiler>
  extends AsyncIterableIterator<IJCCCompilerTypes<TCompiler>["lexeme"]>,
    IJCCModule<TCompiler> {
  readonly options: Readonly<IJCCLexGeneratorOptions>;
}
