import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { CSintContext } from "../context.js";

export interface ICSintWorkerConstructor {
  new (ctx: CSintContext): ICSintWorker;
}

export interface ICSintWorker {
  readonly tokens?: Set<number>;

  /**
   * Consumes a token and returns if it should join or exit the context.
   * @returns `n`
   * - `< 0`: exit `n` contexts
   * - `0`: do nothing
   * - `> 0`: join `n` contexts
   */
  use(token: ICLexeme | JCCDictRule<ICLexeme>): number;
}
