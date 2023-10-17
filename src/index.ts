import { createCommand } from "commander";
import { register } from "./commands";
import { JCCError } from "./errors/jcc.error";
import { JCCErrorHandler } from "./modules/error-handler";

async function main() {
  const cmd = createCommand("jcc")
    .version("0.0.1")
    .description("Case study of a minimalist C compiler built in JavaScript");
  await register(cmd);

  const errorHandler = new JCCErrorHandler();

  await cmd.parseAsync().catch((err) => errorHandler.handle(err));
}

main();
