import { CLexConsumer } from "@/compilers/clang/lex/c.lex-consumer";
import { CLexemeType } from "@/compilers/clang/lex/interfaces/lexeme-type.interface";
import { ICommand } from "@/interfaces/cmd.interface";
import { JCCErrorHandler } from "@/modules/error-handler";
import { JCCLexGenerator } from "@/modules/lex-generator";
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
      reader,
    });

    try {
      const lexGenerator = new JCCLexGenerator({
        reader,
        consumer: new CLexConsumer(),
      });

      lexGenerator.on("error", (err) => {
        errorHandler.handle(err);
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
      errorHandler.handle(err);
    }
  });
};
