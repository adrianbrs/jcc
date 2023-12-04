import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { CSintContext } from "../context.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";
import { ICSintFunctionDefinition } from "../interfaces/functions.interface.js";
import { C_TOKENS } from "../../lex/lexemes/tokens.js";
import { CSintDeclarationsWorker } from "./declarations.worker.js";

export class CSintFunctionsWorker implements ICSintWorker {
  #functions = new Map<number, ICSintFunctionDefinition>();
  #current?: ICSintFunctionDefinition;

  readonly tokens = new Set<number>([
    CSintRule.FUNCTION_DECLARATION,
    C_TOKENS.get("{").id,
    CSintRule.FUNCTION_DEFINITION,
  ]);

  private _declarationsWorker = this.ctx.getWorker(CSintDeclarationsWorker);

  constructor(readonly ctx: CSintContext) {}

  useFunctionDeclaration(): void {
    this.#current = {
      declaration: this._declarationsWorker.current!,
    };
    return;
  }

  useLBrace(): void {
    if (!this.#current) {
      return;
    }

    const { declaration } = this.#current;

    // Redefinition error
    if (this.has(declaration.identifier.key!)) {
      this.ctx.reader.raise(
        `redefinition of '${declaration.identifier.value}'`,
        {
          lexemes: [declaration.identifier],
        }
      );
    }
  }

  useFunctionDefinition(token: JCCDictRule<ICLexeme>): void {
    if (!this.#current) {
      return;
    }

    const [bodyOrRBrace] = token.getTokens().slice(2) as [
      JCCDictRule<ICLexeme> | ICLexeme
    ];

    this.#current.body =
      bodyOrRBrace instanceof JCCDictRule ? bodyOrRBrace : undefined;
    this.#functions.set(
      this.#current.declaration.identifier.key!,
      this.#current
    );
    this.#current = undefined;
  }

  use(token: ICLexeme | JCCDictRule<ICLexeme>): number {
    switch (token.id) {
      case CSintRule.FUNCTION_DECLARATION:
        this.useFunctionDeclaration();
        break;
      case C_TOKENS.get("{").id:
        this.useLBrace();
        break;
      case CSintRule.FUNCTION_DEFINITION:
        this.useFunctionDefinition(token as JCCDictRule<ICLexeme>);
        break;
    }

    return 0;
  }

  has(key: number, onlySelf: boolean = false): boolean {
    return Boolean(
      this.#functions.has(key) ||
        (!onlySelf && this.ctx.prev()?.getWorker(CSintFunctionsWorker).has(key))
    );
  }

  get(key: number, onlySelf: boolean = false): ICSintFunctionDefinition | null {
    return (
      this.#functions.get(key) ||
      (!onlySelf &&
        this.ctx.prev()?.getWorker(CSintFunctionsWorker).get(key)) ||
      null
    );
  }

  getCurrent(): ICSintFunctionDefinition | undefined {
    return (
      this.#current ??
      this.ctx.prev()?.getWorker(CSintFunctionsWorker).getCurrent()
    );
  }
}
