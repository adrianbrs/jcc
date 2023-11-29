import { Command } from "commander";
import { lexeme } from "./lexeme.cmd.js";
import { dict } from "./dict.cmd.js";
import { compile } from "./compile.cmd.js";

export const register = async (parent: Command) => {
  await Promise.all([lexeme(parent), dict(parent), compile(parent)]);
};
