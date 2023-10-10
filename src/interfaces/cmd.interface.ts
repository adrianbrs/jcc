import { Command } from "commander";

export interface ICommand {
  (parent: Command): void | Promise<void>;
}
