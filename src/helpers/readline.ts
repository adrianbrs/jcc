import { createReadStream } from "fs";

export function readLineRange(
  filepath: string,
  byteStart: number,
  byteEnd: number,
  encoding?: BufferEncoding
): Promise<string[]> {
  const readable = createReadStream(filepath, {
    start: byteStart,
    encoding,
  });

  return new Promise<string[]>((_resolve, _reject) => {
    const lines: string[] = [];
    let ended = false;
    let line = "";
    let chunk: string | null = null;
    let maxLength = byteEnd - byteStart;

    const onReadable = () => {
      while (null !== (chunk = readable.read(1))) {
        maxLength--;
        line += chunk;

        if (chunk === "\n") {
          lines.push(line);
          line = "";

          if (maxLength <= 0) {
            readable.destroy();
            break;
          }
        }
      }
    };

    const resolve = () => {
      if (!ended) {
        cleanup();
        _resolve(lines);
      }
    };

    const reject = (err: any) => {
      if (!ended) {
        cleanup();
        _reject(err);
      }
    };

    const cleanup = () => {
      ended = true;
      readable.off("readable", onReadable);
      readable.off("end", resolve);
      readable.off("close", resolve);
      readable.off("error", reject);
    };

    readable.on("readable", onReadable);
    readable.once("end", resolve);
    readable.once("close", resolve);
    readable.once("error", reject);
  }).finally(() => {
    readable.destroy();
  });
}
