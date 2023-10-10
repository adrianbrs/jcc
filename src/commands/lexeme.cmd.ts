import { ICommand } from "src/interfaces/cmd.interface";
import { JCCLexGenerator } from "src/modules/lex-generator";
import { JCCReader } from "src/modules/reader";

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

    const lexGenerator = new JCCLexGenerator({
      reader,
    });

    for await (const lexeme of lexGenerator) {
      console.log(`<${lexeme.value}>`);
    }
  });
};
