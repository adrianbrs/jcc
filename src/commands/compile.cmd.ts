import { CLexConsumer } from "@/compilers/clang/lex/c.lex-consumer.js";
import { ICommand } from "@/interfaces/cmd.interface.js";
import {
  IJCCDictJSON,
  JCCDictNode,
  JCCDictRule,
  loadDict,
} from "@/modules/dict.js";
import { JCCErrorHandler } from "@/modules/error-handler.js";
import { JCCLexGenerator } from "@/modules/lex-generator.js";
import { JCCLogger } from "@/modules/logger.js";
import { JCCReader } from "@/modules/reader.js";
import clangDictionary from "@/clang.json";
import { ICLexeme } from "@/compilers/clang/lex/interfaces/lexeme.interface.js";
import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";

interface CompileOptions {
  encoding: BufferEncoding;
}

class Context {
  #state: IJCCFileState;
  #rule?: JCCDictRule;

  get state() {
    return this.#state;
  }

  get rule() {
    return this.#rule;
  }

  constructor(readonly reader: IJCCReader) {
    this.#state = reader.state;
  }

  update(rule?: JCCDictRule) {
    this.#state = this.reader.state;
    this.#rule = rule;
  }

  toJSON() {
    return {
      state: this.state,
      rule: this.rule,
    };
  }
}

export const compile: ICommand = (parent) => {
  const cmd = parent.command("compile").description("Compile source files");

  cmd.argument("<filepath>", "Path to source code file");

  cmd.option(
    "-e, --encoding <encoding>",
    "Encoding of source code file",
    "utf-8"
  );

  cmd.action(async (filepath: string, options: CompileOptions) => {
    const reader = new JCCReader({
      filepath,
      encoding: options.encoding,
    });

    const logger = new JCCLogger(reader);
    reader.setLogger(logger);

    const errorHandler = new JCCErrorHandler({
      logger,
    });

    try {
      const lexGenerator = new JCCLexGenerator({
        reader,
        consumer: new CLexConsumer(),
      });

      lexGenerator.on("error", async (err) => {
        await errorHandler.handle(err);
      });

      const dict = loadDict(clangDictionary as unknown as IJCCDictJSON);

      const stack: (ICLexeme | JCCDictRule)[] = [];

      const shift = async () => {
        return lexGenerator.next().then((res) => {
          if (res.done) {
            return false;
          }

          stack.push(res.value);
          return true;
        });
      };

      await shift();

      const context = new Context(reader);

      while (stack.length) {
        // console.log(stack.map((item) => item.id));
        const item = stack.pop()!;
        const rules = dict.findByTokenId(item.id);

        if (!rules.length) {
          stack.push(item); // rollback

          if (!(await shift())) {
            break;
          }
          continue;
        }

        let matched = false;
        for (const rule of rules) {
          let node: JCCDictNode = rule.tree.get(item.id)!;
          let lastValidNode: JCCDictNode = node;

          // walk rule tree
          const rollback: (JCCDictRule | ICLexeme)[] = [];

          while (node && stack.length) {
            const next = stack.pop()!;

            if (!node.has(next.id)) {
              stack.push(next);
              break;
            }

            rollback.push(next);
            node = node.get(next.id)!;

            if (node.rules.includes(rule.id)) {
              lastValidNode = node;
              rollback.length = 0;
            }
          }

          stack.push(...rollback.reverse());

          // rule not matched, rollback the whole stack
          if (!lastValidNode.rules.includes(rule.id)) {
            continue;
          }

          stack.push(rule);
          context.update(rule);
          matched = true;

          // rule validations
          if (rule.comments.length > 0) {
            console.log(rule.comments);
          }
          break;
        }

        if (matched) {
          continue;
        }

        // Rollback if no rule matched
        stack.push(item); // rollback
        if (!(await shift())) {
          break;
        }
      }

      if (stack.length > 1) {
        reader.raise(
          `invalid syntax ${JSON.stringify(context.rule?.name ?? "UNKNOWN")}`,
          {
            byteStart: context.state.byte,
          }
        );
      }
    } catch (err) {
      await errorHandler.handle(err);
    }
  });
};
