import { CSintTypesWorker } from "./types.worker.js";
import { CSintDeclarationsWorker } from "./declarations.worker.js";
import { ICSintWorkerConstructor } from "../interfaces/worker.interface.js";

export const workers = [
  CSintTypesWorker,
  CSintDeclarationsWorker,
] as const satisfies ICSintWorkerConstructor[];
