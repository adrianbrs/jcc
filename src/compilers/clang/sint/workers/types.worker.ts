import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { checkRule } from "@/helpers/dict.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";
import { getTypeName, isTypeValid } from "../types.js";

export class CSintTypes implements ICSintWorker {
  readonly rules = [CSintRule.TYPE];

  constructor(readonly ctx: CSintContext) {}

  use(rule: JCCDictRule<ICLexeme>) {
    if (!checkRule(rule, CSintRule.TYPE)) {
      return false;
    }

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

    return true;
  }
}
