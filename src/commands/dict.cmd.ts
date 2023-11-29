import { ICommand } from "@/interfaces/cmd.interface.js";
import { readFile } from "fs/promises";
import path from "path";

interface CmdOptions {
  depth: number;
}

export const dict: ICommand = (parent) => {
  const cmd = parent.command("dict").description("Manage dictionaries");

  const viewCmd = cmd.command("show").description("Show dictionary");
  viewCmd.argument("[dict_file]", "Dictionary file path", "src/clang.json");
  viewCmd.option(
    "-d, --depth <depth>",
    "Depth of the tree",
    (v: string) => parseInt(v),
    3
  );

  viewCmd.action(async (dictFile: string, options: CmdOptions) => {
    const filepath = path.resolve(process.cwd(), dictFile);
    const json = JSON.parse(await readFile(filepath, "utf-8"));
    console.dir(json, { depth: options.depth });
  });
};
