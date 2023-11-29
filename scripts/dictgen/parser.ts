import { resolve } from "path";
import { JCCDict, JCCDictNode, JCCDictRule } from "../../src/modules/dict.ts";
import { CLexemeType } from "../../src/compilers/clang/lex/interfaces/lexeme-type.interface.ts";
import { C_KEYWORDS } from "../../src/compilers/clang/lex/tokens/keywords.ts";
import { C_TOKENS } from "../../src/compilers/clang/lex/tokens/tokens.ts";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import os from "os";

export interface ParserOptions {
  separator: string;
}

interface LineData {
  id: number | null;
  name: string | null;
  comments: string[];
  tokens: number[];
}

export class DictParser {
  #ruleIds = new Map<string, number>();

  constructor(readonly options: ParserOptions) {}

  getRuleId(name: string): number {
    if (!this.#ruleIds.has(name)) {
      const id = CLexemeType.TOKEN + 1000 + this.#ruleIds.size;
      this.#ruleIds.set(name, id);
    }
    return this.#ruleIds.get(name)!;
  }

  getTokens(row: string): number[] {
    const tokens: number[] = [];

    for (let entry of row.split(/([^\w]+)/)) {
      entry = entry.trim();

      if (!entry.length) {
        continue;
      }

      // RULES
      if (/^[A-Z_]+$/.test(entry)) {
        tokens.push(this.getRuleId(entry));
        continue;
      }

      // WORDS
      if (/^\w+$/.test(entry)) {
        switch (entry) {
          case "id":
            tokens.push(CLexemeType.IDENTIFIER);
            continue;
          case "number_literal":
            tokens.push(CLexemeType.NUMBER_LITERAL);
            continue;
          case "string_literal":
            tokens.push(CLexemeType.STRING_LITERAL);
            continue;
          case "char_literal":
            tokens.push(CLexemeType.CHAR_LITERAL);
            continue;
          default:
            if (C_KEYWORDS.has(entry)) {
              tokens.push(C_KEYWORDS.get(entry)!.id);
              continue;
            }
            break;
        }
      }

      // TOKENS
      entry = entry.replace(/\s+/g, "");
      let i = 1;

      while (i <= entry.length) {
        const token = entry.slice(0, i);

        if (C_TOKENS.has(token)) {
          if (C_TOKENS.hasPrefix(token + entry[i])) {
            i++;
            continue;
          }
          tokens.push(C_TOKENS.get(token)!.id);
          entry = entry.slice(i);
          i = 1;
          continue;
        }

        if (token.length === 1) {
          throw new Error(
            `Invalid token ${JSON.stringify(entry)} on line ${JSON.stringify(
              row
            )}`
          );
        }

        i++;
      }
    }

    return tokens;
  }

  parseLine(line: string, lineNo: number): LineData {
    line = line.trim();

    const data: LineData = {
      id: null,
      name: null,
      comments: [],
      tokens: [],
    };

    if (!line.length) {
      return data;
    }

    const [def, comment] = line.split(/\s*(#.*)/);

    if (comment) {
      data.comments.push(comment.replace(/^#\s*/, ""));
    }

    if (!def) {
      return data;
    }

    const [name, definition] = def
      .split(this.options.separator)
      .map((str) => str.trim());

    if (!(name && definition)) {
      throw new Error(
        `Invalid rule definition ${JSON.stringify(def)} on line ${lineNo}`
      );
    }

    const id = this.getRuleId(name);

    if (isNaN(id)) {
      throw new Error(`Invalid rule id ${name} on line ${lineNo}`);
    }

    const tokens = this.getTokens(definition);

    if (tokens.some((entry) => isNaN(entry))) {
      throw new Error(`Invalid rule entry ${definition} on line ${lineNo}`);
    }

    data.id = id;
    data.name = name;
    data.tokens = tokens;

    return data;
  }

  parseRules(raw: string): JCCDictRule[] {
    const ruleMap = new Map<number, JCCDictRule>();
    const lines = raw.split(/\n|\r\n/);
    let prevComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNo = i + 1;
      const line = lines[i].trim();
      const { id, name, comments, tokens } = this.parseLine(line, lineNo);

      if (comments.length) {
        prevComments.push(...comments);
        continue;
      }

      if (id === null || name == null) {
        continue;
      }

      const rule = ruleMap.get(id) ?? new JCCDictRule(id, name);

      rule.comments.push(...prevComments);
      prevComments = [];

      // Build tree
      let node = rule.tree;

      for (const entry of tokens.reverse()) {
        const next = node.get(entry) ?? new JCCDictNode();
        node.set(entry, next);
        node = next;
      }

      node.rules.push(rule.id);

      ruleMap.set(id, rule);
    }

    return [...ruleMap.values()];
  }

  async transform(filename: string): Promise<string> {
    const filepath = resolve(process.cwd(), filename);

    if (!existsSync(filepath)) {
      throw new Error(`File ${filename} does not exist`);
    }

    const raw = await readFile(filepath, "utf-8");
    const lines = raw.split(/\n|\r\n/);

    return lines
      .map((line, i) => {
        const { id, tokens } = this.parseLine(line, i + 1);
        if (id !== null) {
          return `${id} ${this.options.separator} ${tokens.join(
            " "
          )} # ${line}`;
        }
        return line;
      })
      .join(os.EOL);
  }

  async parse(filename: string): Promise<JCCDict> {
    const filepath = resolve(process.cwd(), filename);

    if (!existsSync(filepath)) {
      throw new Error(`File ${filename} does not exist`);
    }

    const raw = await readFile(filepath, "utf-8");
    const rules = this.parseRules(raw);

    return new JCCDict(rules);
  }
}
