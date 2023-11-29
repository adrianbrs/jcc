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

interface CompileOptions {
  encoding: BufferEncoding;
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

      while (stack.length) {
        console.log(stack.map((item) => item.id));
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
          }

          // rule not matched, rollback the whole stack
          if (!node.rules.includes(rule.id)) {
            stack.push(...rollback.reverse());
            continue;
          }

          stack.push(rule);
          matched = true;
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
    } catch (err) {
      await errorHandler.handle(err);
    }
  });
};
