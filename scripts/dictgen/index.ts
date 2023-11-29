import { createCommand } from "commander";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { JCCDict } from "../../src/modules/dict";
import path from "path";
import { DictParser, ParserOptions } from "./parser.ts";

interface Options extends ParserOptions {
  output: string;
  transform?: string;
  compress: boolean;
}

async function bootstrap() {
  const cmd = createCommand();

  cmd.argument("<rules_file>", "Path to the dictionary rules file");

  cmd.option(
    "-s, --separator <separator>",
    "Separator between rule id and entries",
    "::="
  );

  cmd.option("-o, --output <output>", "Output file path", "src/clang.json");
  cmd.option(
    "-t, --transform <output>",
    "Output grammar file with tokens replaced by their IDs"
  );
  cmd.option("--compress", "Compress output file", false);

  cmd.action(async (rulesFile: string, options: Options) => {
    const inputFilepath = path.resolve(process.cwd(), rulesFile);

    if (!existsSync(inputFilepath)) {
      throw new Error(`File ${inputFilepath} does not exist`);
    }

    const parser = new DictParser(options);
    const outputFilepath = path.resolve(process.cwd(), options.output);
    const dict = await parser.parse(inputFilepath);

    await writeFile(
      outputFilepath,
      JSON.stringify(dict, null, options.compress ? 0 : 2),
      "utf-8"
    );

    if (options.transform) {
      const transformOutputFilepath = path.resolve(
        process.cwd(),
        options.transform
      );
      const transformed = await parser.transform(inputFilepath);
      await writeFile(transformOutputFilepath, transformed, "utf-8");
    }

    console.log(
      `Done! Generated ${path.relative(process.cwd(), outputFilepath)}`
    );
  });

  await cmd.parseAsync();
}
bootstrap();
