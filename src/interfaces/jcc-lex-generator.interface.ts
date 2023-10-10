import { IJCCReader } from "./jcc-reader.interface";

export interface IJCCLexGeneratorOptions {
  reader: IJCCReader;
}

export interface IJCCLexeme {
  value: string;
}

export interface IJCCLexGenerator extends AsyncIterableIterator<IJCCLexeme> {}
