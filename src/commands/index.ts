import { Command } from "commander";
import { lexeme } from "./lexeme.cmd";

export const register = async (parent: Command) => {
  await Promise.all([lexeme(parent)]);
};
