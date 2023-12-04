import { getDepth } from "@/helpers/tree.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";

export interface IJCCDictNodeJSON {
  rules: number[];
  children: Record<number, IJCCDictNodeJSON>;
}

export interface IJCCDictRuleJSON {
  id: number;
  name: string;
  comments: string[];
  tree: IJCCDictNodeJSON;
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

  getTokens(): (T | JCCDictRule<T>)[] {
    return [...this.#tokens];
  }

  getToken(index: number): T | JCCDictRule<T> {
    return this.#tokens[index];
  }

  toJSON(): IJCCDictRuleJSON {
    return {
      id: this.id,
      name: this.name,
      comments: this.comments,
      tree: this.tree.toJSON(),
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
    const expected: number[] = [];

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
        expected.push(key);
        continue;
      }

      stack.push(...node.entries());
    }

    return expected;
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
