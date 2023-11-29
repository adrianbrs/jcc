import { ReadStream, createReadStream, existsSync } from "fs";
import {
  IJCCReader,
  IJCCReaderLineInfo,
  IJCCReaderOptions,
} from "../interfaces/jcc-reader.interface.js";
import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCErrorOptions, JCCError } from "@/errors/jcc.error.js";
import EventEmitter from "events";
import { IJCCLogger } from "@/interfaces/jcc-logger.interface.js";

export class JCCReader extends EventEmitter implements IJCCReader {
  private readonly _state: IJCCFileState = {
    filepath: this.filepath,
    encoding: this.encoding,
    line: 1,
    column: 1,
    byte: 0,
  };
  #readStream: ReadStream;
  #lineMap = new Map<number, IJCCReaderLineInfo>();
  #logger?: IJCCLogger;
  #closed = false;

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

  get logger() {
    return this.#logger;
  }

  get closed() {
    return this.#closed;
  }

  constructor(private readonly _options: IJCCReaderOptions) {
    super();

    if (!existsSync(this.filepath)) {
      this.raise("File not found");
    }

    this.#readStream = createReadStream(this.filepath);

    this.#readStream.on("close", () => {
      this.close();
    });
  }

  close(): void {
    if (!this.#closed) {
      this.#closed = true;
      this.#readStream.close();
      this.emit("close");
    }
  }

  setLogger(logger?: IJCCLogger | undefined): void {
    this.#logger = logger;
  }

  makeError(message: string, options?: IJCCErrorOptions | undefined): JCCError {
    const state = this.state;

    const [line, column] =
      typeof options?.byteStart !== "undefined"
        ? this.getLineAndColumn(options.byteStart)
        : [state.line, state.column];

    return new JCCError(message, {
      state,
      line,
      column,
      ...options,
    });
  }

  raise(message: string, options?: IJCCErrorOptions | undefined): never {
    throw this.makeError(message, options);
  }

  getLineInfo(line: number): IJCCReaderLineInfo {
    if (line <= 0) {
      this.raise("line number cannot be less than or equal to 0");
    }
    if (line > this.getReadLineCount()) {
      this.raise("line not read");
    }

    return this.#lineMap.get(line)!;
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
    return this.#lineMap.size;
  }

  readable() {
    return new Promise<ReadStream>((_resolve, _reject) => {
      let done = false;

      const resolve = () => {
        if (!done) {
          done = true;
          cleanup();

          _resolve(this.#readStream);
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
        this.#readStream.off("readable", resolve);
        this.#readStream.off("end", resolve);
        this.#readStream.off("close", resolve);
        this.#readStream.off("error", reject);
      };

      this.#readStream.once("readable", resolve);
      this.#readStream.once("end", resolve);
      this.#readStream.once("close", resolve);
      this.#readStream.once("error", reject);

      if (this.#readStream.readableLength > 0 || this.#readStream.closed) {
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

    this.#readStream.unshift(data);
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

  async next(): Promise<IteratorResult<string>> {
    return this.readable().then((stream) => {
      if (this.closed || !stream.readable) {
        if (!this.closed) {
          this.close();
        }
        return { done: true, value: "" };
      }

      const chunk = stream.read(1) as Buffer;

      if (!chunk) {
        return this.next();
      }

      let lineInfo = this.#lineMap.get(this._state.line);
      if (!lineInfo) {
        lineInfo = {
          byteStart: this._state.byte,
          byteEnd: this._state.byte,
        };
        this.#lineMap.set(this._state.line, lineInfo);
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
