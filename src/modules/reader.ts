import { ReadStream, createReadStream, existsSync } from "fs";
import { JCCError, IJCCErrorOptions } from "../errors/jcc.error";
import {
  IJCCReader,
  IJCCReaderOptions,
} from "../interfaces/jcc-reader.interface";
import { IJCCFileState } from "@/interfaces/file-state.interface";

export class JCCReader implements IJCCReader {
  private readonly _state: IJCCFileState = {
    filepath: this.filepath,
    encoding: this.encoding,
    line: 1,
    column: 1,
    byte: 0,
  };
  private readonly _readStream: ReadStream;
  private readonly _lineColMap = new Map<number, number>();

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
    if (!existsSync(this.filepath)) {
      this.raise("File not found");
    }

    this._readStream = createReadStream(this.filepath);
  }

  makeError(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState> | undefined
  ): JCCError {
    return new JCCError(message, {
      ...this.state,
      ...options,
    });
  }

  raise(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState> | undefined
  ): never {
    throw this.makeError(message, options);
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

  unshift(chunk: string | Buffer) {
    if (this._state.byte === 0) {
      this.raise("Cannot unshift before reading");
    }

    this._readStream.unshift(chunk);
    this._state.byte -= chunk.length;

    if (chunk === "\n") {
      this._state.line--;
      this._state.column = this._lineColMap.get(this._state.line) ?? 1;
    } else if (chunk !== "\r") {
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
      this._state.byte++;

      if (!chunk) {
        return this.next();
      }

      const char = chunk.toString(this.encoding);

      if (char !== "\r") {
        if (char === "\n") {
          this._lineColMap.set(this._state.line, this._state.column);
          this._state.line++;
          this._state.column = 1;
        } else {
          this._state.column++;
        }
      }

      return { done: false, value: char };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
