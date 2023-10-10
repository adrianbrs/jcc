import { createCommand } from "commander";
import { register } from "./commands";

async function main() {
  const cmd = createCommand("jcc")
    .version("0.0.1")
    .description("Case study of a minimalist C compiler built in JavaScript");
  await register(cmd);
  await cmd.parseAsync();
}

main();
