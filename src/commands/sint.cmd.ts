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
import { ICLexeme } from "@/compilers/clang/lex/interfaces/lexeme.interface.js";
import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";
import { CSintContext } from "@/compilers/clang/sint/context.js";
import { getLexeme } from "@/compilers/clang/lex/lexemes/index.js";
import { CSintRule } from "@/compilers/clang/sint/rules.js";
import { JCCLogLevel } from "@/interfaces/jcc-logger.interface.js";
import clangDictionary from "@/compilers/clang/sint/dict.json";
import util from "util";

interface CompileOptions {
  encoding: BufferEncoding;
}

export const compile: ICommand = (parent) => {
  const cmd = parent
    .command("sint")
    .description("Perform syntactic analysis on the source file");

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

    const logger = new JCCLogger(reader, {
      level: JCCLogLevel.LOG,
    });
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

      const dict = loadDict<ICLexeme>(
        clangDictionary as unknown as IJCCDictJSON
      );

      let context = new CSintContext(reader);
      const stack: (ICLexeme | JCCDictRule<ICLexeme>)[] = [];

      const fork = () => {
        context = context.fork();
        reader.setContext(context);
      };

      const exit = () => {
        context = context.exit()!;
        reader.setContext(context);
      };

      const shift = async () => {
        return lexGenerator.next().then((res) => {
          if (res.done) {
            return false;
          }

          stack.push(res.value);
          return true;
        });
      };

      const useToken = (item: ICLexeme | JCCDictRule<ICLexeme>) => {
        const result = context.use(item);
        if (result) {
          for (let i = 0; i < Math.abs(result); i++) {
            result < 0 ? exit() : fork();
          }
        }
        return result;
      };

      await shift();

      while (stack.length) {
        console.log(
          context.id +
            ": " +
            stack.map((item) => item.name).join(" ") +
            " " +
            util.inspect(
              stack
                .flatMap((item) =>
                  item instanceof JCCDictRule ? item.comments : ""
                )
                .filter(Boolean),
              { depth: 2, compact: false, colors: true }
            )
        );

        const item = stack.pop()!;
        const rules = dict.findByTokenId(item.id);

        if (!rules.length) {
          // Use token
          useToken(item);
          stack.push(item); // rollback

          if (!(await shift())) {
            break;
          }
          continue;
        }

        const matchedRules = rules
          .map((rule) => {
            let node: JCCDictNode = rule.tree.get(item.id)!;
            let lastValidNode: JCCDictNode = node;

            // walk rule tree
            let rollback: (JCCDictRule<ICLexeme> | ICLexeme)[] = [];

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
              }
            }

            // remake stack
            rollback = rollback.reverse();
            stack.push(...rollback);

            // rule not matched, rollback the whole stack
            if (!lastValidNode.rules.includes(rule.id)) {
              return false;
            }

            return rule.build(rollback.concat(item));
          })
          .filter(Boolean) as JCCDictRule<ICLexeme>[];

        // rule matched
        if (matchedRules.length) {
          // find the longest rule
          const rule = matchedRules.reduce((prev, curr) => {
            return prev.getTokens().length > curr.getTokens().length
              ? prev
              : curr;
          }, matchedRules[0]);

          // remove matched tokens from stack
          for (let i = 0; i < rule.getTokens().length - 1; i++) {
            stack.pop();
          }

          // Use token
          useToken(item);
          stack.push(rule);
          continue;
        }

        // Rollback if no rule matched
        stack.push(item); // rollback
        if (!(await shift())) {
          break;
        }
      }

      // empty file
      if (!stack.length) {
        return;
      }

      // invalid syntax
      if (stack.length > 1 || stack[0].id !== CSintRule.STATEMENT) {
        const lastToken = stack[stack.length - 2] || stack[stack.length - 1];
        const lexeme =
          lastToken instanceof JCCDictRule
            ? lastToken.getFirstLexeme()
            : lastToken;

        const expectedTokens = dict.findExpected(lastToken.id);
        const expected = expectedTokens
          .map((id) => getLexeme(id) || dict.get(id))
          .map(
            (item) =>
              `${
                item instanceof JCCDictRule
                  ? item.name.toLowerCase().split("_").join(" ")
                  : `'${item?.value}'`
              }`
          )
          .join(", ");

        reader.raise(`invalid syntax, expected ${expected}`, {
          lexemes: [lexeme],
        });
      }
    } catch (err) {
      await errorHandler.handle(err);
    }
  });
};
