import { ReadStream, createReadStream, existsSync } from "fs";
import { JCCError, IJCCErrorOptions } from "../errors/jcc.error";
import {
  IJCCReader,
  IJCCReaderEventArgs,
  IJCCReaderEventNames,
  IJCCReaderLineInfo,
  IJCCReaderOptions,
} from "../interfaces/jcc-reader.interface";
import { IJCCFileState } from "@/interfaces/file-state.interface";
import EventEmitter from "events";

export class JCCReader extends EventEmitter implements IJCCReader {
  private readonly _state: IJCCFileState = {
    filepath: this.filepath,
    encoding: this.encoding,
    line: 1,
    column: 1,
    byte: 0,
  };
  private readonly _readStream: ReadStream;
  private readonly _lineMap = new Map<number, IJCCReaderLineInfo>();

  get state() {
    return { ...this._state };
  }

  get filepath() {
    return this._options.filepath;
  }

  get encoding() {
    return this._options.encoding ?? "utf-8";
  }

  get options() {
    return { ...this._options };
  }

  constructor(private readonly _options: IJCCReaderOptions) {
    super();

    if (!existsSync(this.filepath)) {
      this.raise("File not found");
    }

    this._readStream = createReadStream(this.filepath);
  }

  on<E extends IJCCReaderEventNames>(
    event: E,
    listener: (...args: IJCCReaderEventArgs<E>) => void
  ): this {
    return super.on(event, listener as (...args: any[]) => void);
  }

  addListener<E extends IJCCReaderEventNames>(
    event: E,
    listener: (...args: IJCCReaderEventArgs<E>) => void
  ): this {
    return super.addListener(event, listener as (...args: any[]) => void);
  }

  getLineInfo(line: number): IJCCReaderLineInfo {
    if (line <= 0) {
      this.raise("line number cannot be less than or equal to 0");
    }
    if (line > this.getReadLineCount()) {
      this.raise("line not read");
    }

    return this._lineMap.get(line)!;
  }

  getLineFromByte(byte: number): number {
    if (byte < 0) {
      this.raise("cannot get line info of negative byte");
    }
    if (byte > this._state.byte) {
      this.raise("cannot get line info of unread byte");
    }

    // Do a binary search to find the line number
    let min = 1;
    let max = this.getReadLineCount();
    let line = 1;
    let lineInfo: IJCCReaderLineInfo;

    while (min <= max) {
      line = Math.floor((min + max) / 2);

      lineInfo = this.getLineInfo(line);

      if (byte < lineInfo.byteStart) {
        max = line - 1;
      } else if (byte > lineInfo.byteEnd) {
        min = line + 1;
      } else {
        break;
      }
    }

    return line;
  }

  getLineAndColumn(byte: number): [number, number] {
    const line = this.getLineFromByte(byte);
    const lineInfo = this.getLineInfo(line);
    const column = byte - lineInfo.byteStart;
    return [line, column];
  }

  getByte(line: number, column: number = 1): number {
    const lineInfo = this.getLineInfo(line);
    const byte = lineInfo.byteStart + column - 1;

    if (byte > lineInfo.byteEnd) {
      this.raise("column not read");
    }

    return byte;
  }

  getColumns(line: number): number {
    const lineInfo = this.getLineInfo(line);
    return lineInfo.byteEnd - lineInfo.byteStart + 1;
  }

  getReadLineCount(): number {
    return this._lineMap.size;
  }

  readable() {
    return new Promise<ReadStream>((_resolve, _reject) => {
      let done = false;

      const resolve = () => {
        if (!done) {
          done = true;
          cleanup();

          _resolve(this._readStream);
        }
      };
      const reject = (err: Error) => {
        if (!done) {
          done = true;
          cleanup();

          _reject(
            this.makeError("Error reading file", {
              cause: err,
            })
          );
        }
      };
      const cleanup = () => {
        this._readStream.off("readable", resolve);
        this._readStream.off("end", resolve);
        this._readStream.off("error", reject);
      };

      this._readStream.once("readable", resolve);
      this._readStream.once("end", resolve);
      this._readStream.once("error", reject);

      if (this._readStream.readableLength > 0) {
        resolve();
      }
    });
  }

  unshift(data: string | Buffer) {
    if (!data.length) {
      return;
    }
    if (this._state.byte === 0) {
      this.raise("Cannot unshift before reading");
    }

    const str = data instanceof Buffer ? data.toString(this.encoding) : data;

    if (str.length > 1) {
      for (let i = str.length - 1; i >= 0; i--) {
        this.unshift(str[i]);
      }
      return;
    }

    this._readStream.unshift(data);
    this._state.byte -= data.length;

    if (str === "\n") {
      this._state.line--;
      this._state.column = this.getColumns(this._state.line);
    } else {
      this._state.column--;
    }
  }

  peek(): Promise<string> {
    return this.next().then(({ done, value }) => {
      if (done) {
        return "";
      }

      this.unshift(value);
      return value;
    });
  }

  next(): Promise<IteratorResult<string>> {
    return this.readable().then((stream) => {
      if (stream.closed || !stream.readable) {
        return { done: true, value: null };
      }

      const chunk = stream.read(1) as Buffer;

      if (!chunk) {
        return this.next();
      }

      let lineInfo = this._lineMap.get(this._state.line);
      if (!lineInfo) {
        lineInfo = {
          byteStart: this._state.byte,
          byteEnd: this._state.byte,
        };
        this._lineMap.set(this._state.line, lineInfo);
      } else {
        lineInfo.byteEnd = this._state.byte;
      }

      this._state.byte++;
      const char = chunk.toString(this.encoding);

      if (char === "\n") {
        this._state.line++;
        this._state.column = 1;
      } else {
        this._state.column++;
      }

      return { done: false, value: char };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
