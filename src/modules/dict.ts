import { getDepth } from "@/helpers/tree.js";

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

export class JCCDictRule {
  readonly comments: string[] = [];
  readonly depth: number = 0;

  constructor(
    readonly id: number,
    readonly name: string,
    readonly tree: JCCDictNode = new JCCDictNode()
  ) {
    this.depth = getDepth(tree);
  }

  toJSON(): IJCCDictRuleJSON {
    return {
      id: this.id,
      name: this.name,
      comments: this.comments,
      tree: this.tree.toJSON(),
    };
  }

  static parse(json: IJCCDictRuleJSON): JCCDictRule {
    const rule = new JCCDictRule(
      json.id,
      json.name,
      JCCDictNode.parse(json.tree)
    );
    rule.comments.push(...json.comments);
    return rule;
  }
}

export class JCCDict implements Iterable<JCCDictRule> {
  #ruleMap = new Map<number, JCCDictRule>();

  constructor(readonly rules: JCCDictRule[] = []) {
    this.rules.sort((ra, rb) => rb.depth - ra.depth);
    for (const rule of rules) {
      this.#ruleMap.set(rule.id, rule);
    }
  }

  get(id: number): JCCDictRule | undefined {
    return this.#ruleMap.get(id);
  }

  findByTokenId(token: number): JCCDictRule[] {
    return this.rules.filter((rule) => rule.tree.has(token));
  }

  [Symbol.iterator](): IterableIterator<JCCDictRule> {
    return this.rules[Symbol.iterator]();
  }

  toJSON(): IJCCDictJSON {
    return {
      rules: this.rules.map((rule) => rule.toJSON()),
    };
  }

  static parse(json: IJCCDictJSON): JCCDict {
    return new JCCDict(json.rules.map(JCCDictRule.parse));
  }
}

export function loadDict(json: IJCCDictJSON): JCCDict {
  return JCCDict.parse(json);
}
