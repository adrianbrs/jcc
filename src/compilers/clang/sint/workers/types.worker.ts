import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";
import { getTypeName, isTypeValid } from "../types.js";

export class CSintTypesWorker implements ICSintWorker {
  readonly tokens = new Set([CSintRule.TYPE]);

  constructor(readonly ctx: CSintContext) {}

  use(rule: JCCDictRule<ICLexeme>): number {
    const lexemes = rule.getLexemes();

    if (!isTypeValid(lexemes)) {
      this.ctx.reader.raise(
        `invalid combination of type specifiers: '${getTypeName(lexemes)}'`,
        {
          byteStart:
            this.ctx.reader.state.byte -
            (lexemes[lexemes.length - 1].value.length - 1),
        }
      );
    }

    return 0;
  }
}
