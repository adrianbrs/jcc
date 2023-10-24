import { ReadStream } from "fs";
import { IJCCFileState } from "./jcc-file-state.interface";
import { IJCCModule } from "./jcc-module.interface";
import { IJCCCompiler } from "./jcc-compiler.interface";

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

export interface IJCCReaderLineInfo {
  byteStart: number;
  byteEnd: number;
}

export interface IJCCReader<TCompiler extends IJCCCompiler = IJCCCompiler>
  extends AsyncIterableIterator<string>,
    IJCCModule<TCompiler> {
  readonly state: IJCCFileState;
  readonly filepath: string;
  readonly encoding: BufferEncoding;

  /**
   * Returns information about the given line.\
   * **The line must be already read!**
   */
  getLineInfo(line: number): IJCCReaderLineInfo;

  /**
   * Returns information about the line that contains the given byte.\
   * **The byte must be already read!**
   */
  getLineFromByte(byte: number): number;

  /**
   * Returns the line and column number of the given byte.\
   * **The byte must be already read!**
   */
  getLineAndColumn(byte: number): [number, number];

  /**
   * Returns the byte at the given line and column number.\
   * **The line and column must be already read!**
   */
  getByte(line: number, column?: number): number;

  /**
   * Returns the number of columns in the given line.\
   * **The line must be already read!**
   */
  getColumns(line: number): number;

  /**
   * Returns the number of lines read.\
   * **Lines are counted even before they are completely read!**
   */
  getReadLineCount(): number;

  /**
   * Pushes data back to the front of the stream.
   */
  unshift(data: string): void;

  /**
   * Returns a promise that resolves to the next character in the stream
   * without advancing the stream.
   */
  peek(): Promise<string>;

  /**
   * Returns a promise that resolves to a readable stream when the stream is
   * ready to be read.
   */
  readable(): Promise<ReadStream>;
}
