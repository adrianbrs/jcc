import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { C_TOKENS } from "../../lex/lexemes/tokens.js";

export class CSintBlockWorker implements ICSintWorker {
  readonly tokens = new Set<number>([
    C_TOKENS.get("{").id,
    C_TOKENS.get("}").id,
  ]);

  constructor(readonly ctx: CSintContext) {}

  use(token: ICLexeme | JCCDictRule<ICLexeme>): number {
    switch (token.id) {
      case C_TOKENS.get("{").id:
        return 1;
      case C_TOKENS.get("}").id:
        return -1;
    }

    return 0;
  }
}
