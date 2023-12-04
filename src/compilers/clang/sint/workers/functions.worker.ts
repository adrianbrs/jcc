import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { checkRule } from "@/helpers/dict.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";

export class CSintFunctions implements ICSintWorker {
  readonly rules = [CSintRule.FUNCTION_DECLARATION];

  constructor(readonly ctx: CSintContext) {}

  use(rule: JCCDictRule<ICLexeme>) {
    if (!checkRule(rule, CSintRule.FUNCTION_DECLARATION)) {
      return false;
    }

    const declaration = this.ctx.declarations.parseSingle(
      (rule.getToken(0) as JCCDictRule<ICLexeme>).getToken(
        0
      ) as JCCDictRule<ICLexeme>
    );

    if (!declaration) {
      return true;
    }

    const { type, identifier, kind } = declaration;

    console.log("fn", type, identifier, kind);

    return true;
  }
}
