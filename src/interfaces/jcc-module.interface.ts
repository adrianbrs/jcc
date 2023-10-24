import { IJCCCompiler } from "./jcc-compiler.interface";

export interface IJCCModule<TCompiler extends IJCCCompiler = IJCCCompiler> {
  readonly compiler: TCompiler;

  /**
   * Called automatically by the compiler before the compilation starts.
   */
  bind(compiler: TCompiler): void;
}
