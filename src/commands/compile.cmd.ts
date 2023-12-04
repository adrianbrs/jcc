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
import clangDictionary from "@/compilers/clang/sint/dict.json";
import { ICLexeme } from "@/compilers/clang/lex/interfaces/lexeme.interface.js";
import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import util from "util";
import { CLexemeType } from "@/compilers/clang/lex/interfaces/lexeme-type.interface.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";
import { CSintContext } from "@/compilers/clang/sint/context.js";
import { getLexeme } from "@/compilers/clang/lex/lexemes/index.js";
import { CSintRule } from "@/compilers/clang/sint/rules.js";
import { JCCLogLevel } from "@/interfaces/jcc-logger.interface.js";

interface CompileOptions {
  encoding: BufferEncoding;
}

interface IContext<T extends IJCCLexeme = IJCCLexeme> {
  id: number;
  state: IJCCFileState;
  readonly reader: IJCCReader;
  readonly stack: (T | JCCDictRule<T>)[];

  addDeclaration(id: string, tokens: (T | JCCDictRule<T>)[]): void;
  hasDeclaration(id: string, onlySelf?: boolean): boolean;
  getDeclaration(id: string, onlySelf?: boolean): (T | JCCDictRule<T>)[] | null;
  fork(): IContext;
  exit(): IContext | null;
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

        let matched = false;
        for (const rule of rules) {
          let node: JCCDictNode = rule.tree.get(item.id)!;
          let lastValidNode: JCCDictNode = node;

          // walk rule tree
          const rollback: (JCCDictRule<ICLexeme> | ICLexeme)[] = [];

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

          // rule not matched, rollback the whole stack
          if (!lastValidNode.rules.includes(rule.id)) {
            stack.push(...rollback.reverse());
            continue;
          }

          // Use token
          useToken(item);
          stack.push(rule.build(rollback.reverse().concat(item)));
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

      // empty file
      if (!stack.length) {
        return;
      }

      // invalid syntax
      if (stack.length > 1 || stack[0].id !== CSintRule.STATEMENT) {
        const lastToken = stack[stack.length - 1];
        const lexemes =
          lastToken instanceof JCCDictRule
            ? lastToken.getLexemes()
            : [lastToken];
        const lexemeValue = lexemes[lexemes.length - 1].value;

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
          byteStart: reader.state.byte - lexemeValue.length,
          byteEnd: reader.state.byte - 1,
        });
      }
    } catch (err) {
      await errorHandler.handle(err);
    }
  });
};
