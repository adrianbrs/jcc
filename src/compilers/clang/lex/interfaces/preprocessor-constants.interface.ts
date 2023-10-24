import { IJCCReader } from "@/interfaces/jcc-reader.interface";

export type ICPreprocessorConstantFn = (
  reader: IJCCReader
) => void | Promise<void>;

export type ICPreprocessorConstantMap = Map<string, ICPreprocessorConstantFn>;
