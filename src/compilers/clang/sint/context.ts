import { JCCContext } from "@/modules/context.js";
import { ICLexeme } from "../lex/interfaces/lexeme.interface.js";
import { JCCDictRule } from "@/modules/dict.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import {
  ICSintWorker,
  ICSintWorkerConstructor,
} from "./interfaces/worker.interface.js";
import { workers } from "./workers/index.js";

export class CSintContext
  extends JCCContext<ICLexeme, CSintContext>
  implements ICSintWorker
{
  #workers = new Map<ICSintWorkerConstructor, ICSintWorker>();

  constructor(
    readonly reader: IJCCReader,
    id: number = 0,
    prev: CSintContext | null = null
  ) {
    super(reader, id, prev);

    for (const Worker of workers) {
      this.#workers.set(Worker, new Worker(this));
    }
  }

  use(token: ICLexeme | JCCDictRule<ICLexeme>): number {
    return Array.from(this.#workers.values()).reduce((res, worker) => {
      if (!worker.tokens || worker.tokens.has(token.id)) {
        return res + worker.use(token);
      }
      return res;
    }, 0);
  }

  getWorker<T extends ICSintWorkerConstructor>(Worker: T): InstanceType<T> {
    return this.#workers.get(Worker) as InstanceType<T>;
  }

  fork() {
    return new CSintContext(this.reader, this.id + 1, this);
  }
}
