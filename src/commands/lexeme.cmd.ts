import { CLexConsumer } from "@/compilers/clang/lex/c.lex-consumer";
import { ICommand } from "@/interfaces/cmd.interface";
import { JCCErrorHandler } from "@/modules/error-handler";
import { JCCLexGenerator } from "@/modules/lex-generator";
import { JCCLogger } from "@/modules/logger";
import { JCCReader } from "@/modules/reader";
import { relative } from "path";

interface ILexemeOptions {
  encoding: BufferEncoding;
}

export const lexeme: ICommand = (parent) => {
  const cmd = parent
    .command("lexeme")
    .description("Extract lexemes from source code")
    .version("0.0.1");

  cmd.argument("<filepath>", "Path to source code file");

  cmd.option(
    "-e, --encoding <encoding>",
    "Encoding of source code file",
    "utf-8"
  );

  cmd.action(async (filepath: string, options: ILexemeOptions) => {
    const reader = new JCCReader({
      filepath,
      encoding: options.encoding,
    });

    const errorHandler = new JCCErrorHandler({
      logger: new JCCLogger(reader),
    });

    try {
      const lexGenerator = new JCCLexGenerator({
        reader,
        consumer: new CLexConsumer(),
      });

      lexGenerator.on("error", async (err) => {
        await errorHandler.handle(err);
      });

      for await (const lexeme of lexGenerator) {
        const { filepath, line, column } = reader.state;
        const path = relative(process.cwd(), filepath);
        console.log(
          `${lexeme.id} ${lexeme.name} ${JSON.stringify(
            lexeme.value
          )} [${path}:${line}:${column}]`
        );
      }
    } catch (err) {
      await errorHandler.handle(err);
    }
  });
};
