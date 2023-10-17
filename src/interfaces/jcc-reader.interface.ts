import { ReadStream } from "fs";
import { IJCCFileState } from "./file-state.interface";
import { JCCError, IJCCErrorOptions } from "@/errors/jcc.error";

export interface IJCCReaderOptions {
  /**
   * The path to the source file to read.
   */
  filepath: string;

  /**
   * The encoding of the source file to read.
   *
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
}

export interface IJCCReader extends AsyncIterableIterator<string> {
  readonly state: IJCCFileState;
  readonly filepath: string;
  readonly encoding: BufferEncoding;

  /**
   * Returns a promise that resolves to a readable stream when the stream is
   * ready to be read.
   */
  readable(): Promise<ReadStream>;

  /**
   * Creates a new `JCCError` with the current state of the reader.
   */
  makeError(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState>
  ): JCCError;

  /**
   * Creates a new `JCCError` with the current state of the reader and throws it.
   *
   * @throws {JCCError}
   */
  raise(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState>
  ): never;
}
