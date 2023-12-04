import { CSintTypesWorker } from "./types.worker.js";
import { CSintDeclarationsWorker } from "./declarations.worker.js";
import { ICSintWorkerConstructor } from "../interfaces/worker.interface.js";
import { CSintFunctionsWorker } from "./functions.worker.js";
import { CSintBlockWorker } from "./blocks.worker.js";

export const workers = [
  CSintTypesWorker,
  CSintDeclarationsWorker,
  CSintFunctionsWorker,
  CSintBlockWorker,
] as const satisfies ICSintWorkerConstructor[];
