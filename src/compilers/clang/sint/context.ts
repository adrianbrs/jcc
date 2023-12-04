import { JCCContext } from "@/modules/context.js";
import { ICLexeme } from "../lex/interfaces/lexeme.interface.js";
import { JCCDictRule } from "@/modules/dict.js";
import { CSintDeclarations } from "./workers/declarations.worker.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICSintWorker } from "./interfaces/worker.interface.js";
import { CSintTypes } from "./workers/types.worker.js";
import { CSintFunctions } from "./workers/functions.worker.js";

export class CSintContext
  extends JCCContext<ICLexeme, CSintContext>
  implements ICSintWorker
{
  readonly declarations: CSintDeclarations;
  readonly types: CSintTypes;
  readonly functions: CSintFunctions;

  constructor(
    readonly reader: IJCCReader,
    id: number = 0,
    prev: CSintContext | null = null
  ) {
    super(reader, id, prev);

    this.declarations = new CSintDeclarations(this);
    this.types = new CSintTypes(this);
    this.functions = new CSintFunctions(this);
  }

  use(rule: JCCDictRule<ICLexeme>): boolean {
    return this.types.use(rule) || this.declarations.use(rule);
  }

  fork() {
    return new CSintContext(this.reader, this.id + 1, this);
  }
}
