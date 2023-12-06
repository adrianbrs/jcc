import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { C_TOKENS } from "../../lex/lexemes/tokens.js";
import { CSintRule } from "../rules.js";

export class CSintLoopWorker implements ICSintWorker {
  readonly tokens = new Set<number>([
    CSintRule.LOOP_STATEMENT,
    CSintRule.LOOP_DECLARATION,
    CSintRule.LOOP_DEFINITION,
  ]);

  #hasLoop = false;

  constructor(readonly ctx: CSintContext) {}

  useLoopDeclaration() {
    this.#hasLoop = true;
  }

  useLoopDefinition() {
    this.#hasLoop = false;
  }

  useLoopStatement(rule: JCCDictRule<ICLexeme>) {
    if (!this.withinLoop()) {
      const lexeme = rule.getFirstLexeme();

      let message = `${lexeme.value} statement not within loop`;

      // or switch
      if (lexeme.value === "break") {
        message += " or switch";
      }

      this.ctx.reader.raise(message, {
        lexemes: [lexeme],
      });
    }
  }

  use(token: ICLexeme | JCCDictRule<ICLexeme>): number {
    switch (token.id) {
      case CSintRule.LOOP_DECLARATION:
        this.useLoopDeclaration();
        break;
      case CSintRule.LOOP_DEFINITION:
        this.useLoopDefinition();
        break;
      case CSintRule.LOOP_STATEMENT:
        this.useLoopStatement(token as JCCDictRule<ICLexeme>);
        break;
    }

    return 0;
  }

  withinLoop(): boolean {
    return (
      this.#hasLoop ||
      (this.ctx.prev()?.getWorker(CSintLoopWorker).withinLoop() ?? false)
    );
  }
}
