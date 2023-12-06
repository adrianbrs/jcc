import { getDepth } from "@/helpers/tree.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";
import util from "util";

export interface IJCCDictNodeJSON {
  rules: number[];
  children: Record<number, IJCCDictNodeJSON>;
}

export interface IJCCDictRuleJSON {
  id: number;
  name: string;
  comments: string[];
  tree: IJCCDictNodeJSON;
  tokens?: (IJCCLexeme | IJCCDictRuleJSON)[];
}

export interface IJCCDictJSON {
  rules: IJCCDictRuleJSON[];
}

export class JCCDictNode extends Map<number, JCCDictNode> {
  readonly rules: number[] = [];

  toJSON(): IJCCDictNodeJSON {
    return {
      rules: this.rules,
      children: Object.fromEntries(
        Array.from(this.entries()).map(([id, node]) => [id, node.toJSON()])
      ),
    };
  }

  static parse(json: IJCCDictNodeJSON): JCCDictNode {
    const node = new JCCDictNode();
    node.rules.push(...json.rules);

    for (const [id, child] of Object.entries(json.children)) {
      node.set(Number(id), JCCDictNode.parse(child));
    }

    return node;
  }
}

export class JCCDictRule<T extends IJCCLexeme = IJCCLexeme> {
  readonly comments: string[] = [];
  readonly depth: number = 0;
  #tokens: (T | JCCDictRule<T>)[] = [];
  #lexemes?: T[];

  constructor(
    readonly id: number,
    readonly name: string,
    readonly tree: JCCDictNode = new JCCDictNode()
  ) {
    this.depth = getDepth(tree);
  }

  build(tokens: (T | JCCDictRule<T>)[]): JCCDictRule<T> {
    const rule = new JCCDictRule<T>(this.id, this.name, this.tree);
    rule.#tokens.push(...tokens);
    return rule;
  }

  getLexemes(): T[] {
    if (!this.#lexemes) {
      this.#lexemes = this.#tokens.flatMap((token) =>
        token instanceof JCCDictRule ? token.getLexemes() : token
      );
    }
    return this.#lexemes;
  }

  getFirstLexeme(): T {
    const firstToken = this.getFirstToken();
    return firstToken instanceof JCCDictRule
      ? firstToken.getFirstLexeme()
      : firstToken;
  }

  getLastLexeme(): T {
    const lastToken = this.getLastToken();
    return lastToken instanceof JCCDictRule
      ? lastToken.getLastLexeme()
      : lastToken;
  }

  getTokens<U extends T | JCCDictRule<T>>(): U[] {
    return [...this.#tokens] as U[];
  }

  getToken<U extends T | JCCDictRule<T>>(index: number): U {
    return this.#tokens[index] as U;
  }

  getFirstToken<U extends T | JCCDictRule<T>>(): U {
    return this.getToken(0);
  }

  getLastToken<U extends T | JCCDictRule<T>>(): U {
    return this.#tokens[this.#tokens.length - 1] as U;
  }

  toJSON(): IJCCDictRuleJSON {
    return {
      id: this.id,
      name: this.name,
      comments: this.comments,
      tree: this.tree.toJSON(),
      ...(this.#tokens?.length && {
        tokens: this.#tokens.map((token) =>
          "toJSON" in token ? token.toJSON() : token
        ),
      }),
    };
  }

  static parse<T extends IJCCLexeme>(json: IJCCDictRuleJSON): JCCDictRule<T> {
    const rule = new JCCDictRule<T>(
      json.id,
      json.name,
      JCCDictNode.parse(json.tree)
    );
    rule.comments.push(...json.comments);
    return rule;
  }

  [util.inspect.custom](depth: number, options: util.InspectOptionsStylized) {
    return util.inspect(this.toJSON(), { depth, ...options });
  }
}

export class JCCDict<T extends IJCCLexeme = IJCCLexeme>
  implements Iterable<JCCDictRule<T>>
{
  #ruleMap = new Map<number, JCCDictRule<T>>();

  constructor(readonly rules: JCCDictRule<T>[] = []) {
    for (const rule of rules) {
      this.#ruleMap.set(rule.id, rule);
    }
  }

  get(id: number): JCCDictRule<T> | undefined {
    return this.#ruleMap.get(id);
  }

  findByTokenId(token: number): JCCDictRule<T>[] {
    return this.rules.filter((rule) => rule.tree.has(token));
  }

  findExpected(id: number): number[] {
    const expected = new Set<number>();

    const stack: [number, JCCDictNode][] = this.rules.map((rule) => [
      rule.id,
      rule.tree,
    ]);

    while (stack.length) {
      const [key, node] = stack.pop()!;

      if (node.has(id)) {
        if (key === 2) {
          console.log(node);
        }
        expected.add(key);
        continue;
      }

      stack.push(...node.entries());
    }

    return Array.from(expected);
  }

  [Symbol.iterator](): IterableIterator<JCCDictRule<T>> {
    return this.rules[Symbol.iterator]();
  }

  toJSON(): IJCCDictJSON {
    return {
      rules: this.rules.map((rule) => rule.toJSON()),
    };
  }

  static parse<T extends IJCCLexeme>(json: IJCCDictJSON): JCCDict<T> {
    return new JCCDict(json.rules.map(JCCDictRule.parse)) as JCCDict<T>;
  }
}

export function loadDict<T extends IJCCLexeme>(json: IJCCDictJSON): JCCDict<T> {
  return JCCDict.parse(json);
}
