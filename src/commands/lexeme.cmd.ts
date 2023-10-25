import { CLexConsumer } from "@/compilers/clang/lex/c.lex-consumer";
import { ICommand } from "@/interfaces/cmd.interface";
import { JCCLogLevel } from "@/interfaces/jcc-logger.interface";
import { JCCErrorHandler } from "@/modules/error-handler";
import { JCCLexGenerator } from "@/modules/lex-generator";
import { JCCLogger } from "@/modules/logger";
import { JCCReader } from "@/modules/reader";
import { createOption } from "commander";
import { relative } from "path";

type LogLevel = Lowercase<keyof typeof JCCLogLevel> | "all" | "none";

interface ILexemeOptions {
  encoding: BufferEncoding;
  logLevel: JCCLogLevel;
}

const validLogLevels = Object.keys(JCCLogLevel)
  .filter((c) => isNaN(+c))
  .map((c) => c.toLowerCase())
  .concat(["all", "none"]) as LogLevel[];

function getLogLevel(level: string) {
  if (level === "all") {
    return JCCLogLevel.LOG;
  } else if (level != null) {
    return JCCLogLevel[level.toUpperCase() as keyof typeof JCCLogLevel] ?? null;
  }

  return null;
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

  cmd.addOption(
    createOption("-ll, --log-level", "Minimum log level to display")
      .default("error")
      .choices(validLogLevels)
      .argParser((val) => getLogLevel(val))
  );

  cmd.action(async (filepath: string, options: ILexemeOptions) => {
    const reader = new JCCReader({
      filepath,
      encoding: options.encoding,
    });

    const logger = new JCCLogger(reader, {
      level: options.logLevel,
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
