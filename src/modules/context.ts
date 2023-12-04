import { IJCCContext } from "@/interfaces/jcc-context.interface.js";
import { IJCCFileState } from "@/interfaces/jcc-file-state.interface.js";
import { IJCCLexeme } from "@/interfaces/jcc-lex-generator.interface.js";
import { JCCDictRule } from "./dict.js";
import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import util from "util";

export abstract class JCCContext<
  T extends IJCCLexeme,
  U extends JCCContext<any, any>
> implements IJCCContext<T>
{
  #state: IJCCFileState;
  #id: number = 0;
  #prev: U | null = null;
  #stack: (T | JCCDictRule<T>)[] = [];

  get id() {
    return this.#id;
  }

  get state() {
    return this.#state;
  }

  get stack() {
    return this.#stack;
  }

  constructor(
    readonly reader: IJCCReader,
    id: number = 0,
    prev: U | null = null
  ) {
    this.#state = reader.state;
    this.#id = id;
    this.#prev = prev;
  }

  prev(): U | null {
    return this.#prev;
  }

  abstract fork(): U;

  exit(): U | null {
    const prev = this.#prev;
    this.#prev = null;
    return prev;
  }

  toJSON(): Record<string, any> {
    return {
      state: this.#state,
      stack: this.#stack.map((item) =>
        "toJSON" in item ? item.toJSON() : item
      ),
      prev: this.#prev?.toJSON(),
    };
  }

  [util.inspect.custom](depth: number, options: util.InspectOptionsStylized) {
    return util.inspect(this.toJSON(), { depth, ...options });
  }
}
