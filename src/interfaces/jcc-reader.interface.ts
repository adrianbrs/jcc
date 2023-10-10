import { ReadStream } from "fs";

export interface IJCCReaderState {
  filepath: string;
  encoding: BufferEncoding;
  line: number;
  column: number;
}

export interface IJCCReaderOptions {
  filepath: string;
  encoding?: BufferEncoding;
}

export interface IJCCReader extends AsyncIterableIterator<string> {
  readonly state: IJCCReaderState;
  readonly filepath: string;
  readonly encoding: BufferEncoding;

  readable(): Promise<ReadStream>;
}
