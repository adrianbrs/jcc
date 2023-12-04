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
  readonly tokens = new Set<number>([
    CSintRule.DECLARATION,
    CSintRule.SINGLE_DECLARATION,
    CSintRule.MULTIPLE_DECLARATION,
    CSintRule.DECLARATION_ASSIGNMENT,
    CSintRule.FUNCTION_DECLARATION,
    CSintRule.STATEMENT,
    C_TOKENS.get(";").id,
    C_TOKENS.get("{").id,
  ]);

  #declarations = new Map<number, ICSintDeclaration>();
  #current?: ICSintDeclaration;

  get current() {
    return this.#current;
  }

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
        console.log("prev", prevSelfDeclaration, this.#current);
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

    this.#declarations.set(identifier.key!, { ...this.#current });
    this.#current.kind = undefined;
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

    // Function initialized like a variable
    if (this.#current.kind === ICSintDeclarationKind.FUNCTION) {
      this.ctx.reader.raise(
        `function '${
          this.#current.identifier.value
        }' is initialized like a variable`,
        {
          lexemes: [this.#current.identifier],
        }
      );
    }

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
      case C_TOKENS.get("{").id:
      case CSintRule.STATEMENT:
        this.validateAndStore();
        this.#current = undefined;
        break;
    }
    return 0;
  }

  getIdentifier(rule: JCCDictRule<ICLexeme>): ICLexeme | undefined {
    switch (rule.id) {
      case CSintRule.SINGLE_DECLARATION:
        return this.parseSingle(rule).identifier!;
      case CSintRule.MULTIPLE_DECLARATION:
        const [identifier] = rule.getTokens().slice(2) as ICLexeme[];
        return identifier;
      case CSintRule.DECLARATION_ASSIGNMENT:
      case CSintRule.DECLARATION:
      case CSintRule.FUNCTION_DECLARATION:
        return this.getIdentifier(rule.getToken(0));
    }
    return undefined;
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
