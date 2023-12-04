import { JCCDictRule } from "@/modules/dict.js";
import { ICLexeme } from "../../lex/interfaces/lexeme.interface.js";
import { checkRule } from "@/helpers/dict.js";
import {
  ICSintDeclaration,
  ICSintDeclarationKind,
} from "../interfaces/declaration.interface.js";
import { CSintContext } from "../context.js";
import { getTypeName, isTypeEqual } from "../types.js";
import { ICSintWorker } from "../interfaces/worker.interface.js";
import { CSintRule } from "../rules.js";

export class CSintDeclarations implements ICSintWorker {
  readonly rules = [CSintRule.DECLARATION];

  #declarations = new Map<number, ICSintDeclaration>();

  constructor(readonly ctx: CSintContext) {}

  parseSingle(rule: JCCDictRule<ICLexeme>): ICSintDeclaration | false {
    if (!checkRule(rule, CSintRule.SINGLE_DECLARATION)) {
      return false;
    }

    const [type, identifier] = rule.getTokens() as [
      JCCDictRule<ICLexeme>,
      ICLexeme,
      ICLexeme | null,
      JCCDictRule<ICLexeme> | null
    ];

    return {
      type,
      identifier,
      kind: ICSintDeclarationKind.VARIABLE,
      assignment: null,
    };
  }

  useSingle(rule: JCCDictRule<ICLexeme>) {
    const declaration = this.parseSingle(rule);

    if (!declaration) {
      return false;
    }

    const { type, identifier } = declaration;

    const prevSelfDeclaration = this.get(identifier.key!, true);

    // Redeclaration
    if (prevSelfDeclaration) {
      // Global scope
      if (this.ctx.id === 0) {
        // Tentative definition type mismatch
        if (
          !isTypeEqual(prevSelfDeclaration.type.getLexemes(), type.getLexemes())
        ) {
          this.ctx.reader.raise(
            `conflicting types for '${identifier.value}'; have '${getTypeName(
              type.getLexemes()
            )}'`
          );
        }
      } else {
        // Local scope
        this.ctx.reader.raise(`redeclaration of '${identifier.value}'`);
      }
    }

    this.#declarations.set(identifier.key!, declaration);

    return true;
  }

  use(rule: JCCDictRule<ICLexeme>) {
    return this.useSingle(rule);
  }

  has(key: number, onlySelf: boolean = false): boolean {
    return Boolean(
      this.#declarations.has(key) ||
        (!onlySelf && this.ctx.prev()?.declarations.has(key))
    );
  }

  get(key: number, onlySelf: boolean = false): ICSintDeclaration | null {
    return (
      this.#declarations.get(key) ??
      (onlySelf ? null : this.ctx.prev()?.declarations.get(key)) ??
      null
    );
  }
}
