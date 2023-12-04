import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import {
  ICSintDeclaration,
  ICSintDeclarationKind,
} from "../interfaces/declaration.interface.js";
import { CSintContext } from "../context.js";
import { getTypeName, isTypeEqual } from "../types.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";
import { C_TOKENS } from "../../lex/lexemes/tokens.js";

export class CSintDeclarationsWorker implements ICSintWorker {
  #declarations = new Map<number, ICSintDeclaration>();
  #current?: ICSintDeclaration;

  constructor(readonly ctx: CSintContext) {}

  parseSingle(rule: JCCDictRule<ICLexeme>): ICSintDeclaration {
    const [type, identifier] = rule.getTokens() as [
      JCCDictRule<ICLexeme>,
      ICLexeme,
      ICLexeme | null,
      JCCDictRule<ICLexeme> | null
    ];

    return {
      type,
      identifier,
    };
  }

  validateAndStore() {
    if (!this.#current) {
      return;
    }

    this.#current.kind ??= ICSintDeclarationKind.VARIABLE;
    const { type, identifier, kind } = this.#current;
    const prevSelfDeclaration = this.get(identifier.key!, true);

    // Redeclaration
    if (prevSelfDeclaration) {
      // Kind mismatch
      if (prevSelfDeclaration.kind !== kind) {
        this.ctx.reader.raise(
          `'${identifier.value}' redeclared as different kind of symbol`,
          {
            lexemes: [identifier],
          }
        );
      }

      // Global scope
      if (this.ctx.id === 0) {
        // Tentative definition type mismatch
        if (
          !isTypeEqual(prevSelfDeclaration.type.getLexemes(), type.getLexemes())
        ) {
          this.ctx.reader.raise(
            `conflicting types for '${identifier.value}'; have '${getTypeName(
              type.getLexemes()
            )}'`,
            {
              lexemes: [identifier],
            }
          );
        }
      } else {
        // Local scope
        this.ctx.reader.raise(`redeclaration of '${identifier.value}'`, {
          lexemes: [identifier],
        });
      }
    }

    this.#declarations.set(identifier.key!, this.#current);
  }

  useSingle(rule: JCCDictRule<ICLexeme>): void {
    this.#current = this.parseSingle(rule);
  }

  useMultiple(rule: JCCDictRule<ICLexeme>): void {
    if (!this.#current) {
      return;
    }

    this.validateAndStore();
    const [identifier] = rule.getTokens().slice(2) as ICLexeme[];
    this.#current.identifier = identifier;
  }

  useAssignment(rule: JCCDictRule<ICLexeme>): void {
    if (!this.#current) {
      return;
    }
    const [expression] = rule.getTokens().slice(2) as [JCCDictRule<ICLexeme>];
    this.#current.kind = ICSintDeclarationKind.VARIABLE;
    this.#current.assignment = expression;
  }

  useFunction(rule: JCCDictRule<ICLexeme>): void {
    if (!this.#current) {
      return;
    }

    // TODO: Validate function declaration
    this.#current.kind = ICSintDeclarationKind.FUNCTION;
  }

  use(token: ICLexeme | JCCDictRule<ICLexeme>) {
    switch (token.id) {
      case CSintRule.DECLARATION:
        return 0;
      case CSintRule.SINGLE_DECLARATION:
        this.useSingle(token as JCCDictRule<ICLexeme>);
        break;
      case CSintRule.MULTIPLE_DECLARATION:
        this.useMultiple(token as JCCDictRule<ICLexeme>);
        break;
      case CSintRule.DECLARATION_ASSIGNMENT:
        this.useAssignment(token as JCCDictRule<ICLexeme>);
        break;
      case CSintRule.FUNCTION_DECLARATION:
        this.useFunction(token as JCCDictRule<ICLexeme>);
        break;
      case C_TOKENS.get(";").id:
      case CSintRule.STATEMENT:
        this.validateAndStore();
        this.#current = undefined;
        break;
    }
    return 0;
  }

  has(key: number, onlySelf: boolean = false): boolean {
    return Boolean(
      this.#declarations.has(key) ||
        (!onlySelf &&
          this.ctx.prev()?.getWorker(CSintDeclarationsWorker).has(key))
    );
  }

  get(key: number, onlySelf: boolean = false): ICSintDeclaration | null {
    return (
      this.#declarations.get(key) ??
      (onlySelf
        ? null
        : this.ctx.prev()?.getWorker(CSintDeclarationsWorker).get(key)) ??
      null
    );
  }
}
