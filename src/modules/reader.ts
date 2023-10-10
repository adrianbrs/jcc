import { ReadStream, createReadStream, existsSync } from "fs";
import { JCCError } from "../errors/jcc.error";
import {
  IJCCReader,
  IJCCReaderOptions,
  IJCCReaderState,
} from "../interfaces/jcc-reader.interface";

export class JCCReader implements IJCCReader {
  private readonly _state: IJCCReaderState = {
    filepath: this.filepath,
    encoding: this.encoding,
    line: 0,
    column: 0,
  };
  private readonly _readStream: ReadStream;

  get state() {
    return { ...this._state };
  }

  get filepath() {
    return this._options.filepath;
  }

  get encoding() {
    return this._options.encoding ?? "utf-8";
  }

  constructor(private readonly _options: IJCCReaderOptions) {
    if (!existsSync(this.filepath)) {
      throw new JCCError("File not found", this.state);
    }

    this._readStream = createReadStream(this.filepath, "utf-8");
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
            new JCCError("Error reading file", {
              ...this.state,
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

  next(): Promise<IteratorResult<string>> {
    return this.readable().then((stream) => {
      if (stream.closed || !stream.readable) {
        return { done: true, value: null };
      }

      const chunk = stream.read(1);

      if (!chunk) {
        return this.next();
      }

      this._state.column++;
      if (chunk === "\n") {
        this._state.line++;
        this._state.column = 0;
      }

      return { done: false, value: chunk };
    });
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
