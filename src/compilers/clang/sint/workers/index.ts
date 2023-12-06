import { CSintTypesWorker } from "./types.worker.js";
import { CSintDeclarationsWorker } from "./declarations.worker.js";
import { CSintFunctionsWorker } from "./functions.worker.js";
import { CSintBlockWorker } from "./blocks.worker.js";
import { CSintLoopWorker } from "./loop.worker.js";

export const workers = [
  CSintTypesWorker,
  CSintDeclarationsWorker,
  CSintFunctionsWorker,
  CSintLoopWorker,
  CSintBlockWorker,
];
