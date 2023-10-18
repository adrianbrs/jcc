import { CLexConsumer } from "@/bindings/c.lex-consumer";
import { CLexemeType } from "@/bindings/interfaces/lexeme-type.interface";
import { ICommand } from "@/interfaces/cmd.interface";
import { JCCLexGenerator } from "@/modules/lex-generator";
import { JCCReader } from "@/modules/reader";

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
      consumer: new CLexConsumer(),
    });

    for await (const lexeme of lexGenerator) {
      console.log(
        `<${lexeme.id}, ${CLexemeType.getName(lexeme.type)}, ${
          lexeme.name
        }, ${JSON.stringify(lexeme.value)}>`
      );
    }
  });
};
