import { CLexemeType } from "./interfaces/lexeme-type.interface.js";
import { ICLexeme } from "./interfaces/lexeme.interface.js";

export interface ICTokenMeta {
  readonly index: number;
  readonly name?: string;
}

export interface ICTokenDict {
  readonly [key: string]: Readonly<ICTokenMeta | number>;
}

export interface ICTokenMetaComputed {
  readonly index: number;
  readonly name: string;
  readonly type: CLexemeType;
  readonly id: number;
}

export type ICTokenDictKeys<T extends ICTokenDict | CTokenDef> = (
  T extends CTokenDef<infer D> ? D : T
) extends infer D
  ? keyof D extends infer K
    ? K extends string
      ? K
      : never
    : never
  : never;

export type ICTokenDictComputed<
  T extends ICTokenDict,
  U extends CLexemeType
> = {
  [K in keyof T]: T[K] extends number
    ? {
        readonly index: T[K];
        readonly name: K;
        readonly type: U;
        readonly id: number;
      }
    : T[K] extends ICTokenMeta
    ? {
        readonly index: T[K]["index"];
        readonly name: T[K]["name"] extends string ? T[K]["name"] : K;
        readonly type: U;
        readonly id: number;
      }
    : never;
};

export interface CTokenDefOptions {
  substrings?: boolean;
}

export class CTokenDef<
  T extends ICTokenDict = ICTokenDict,
  U extends CLexemeType = CLexemeType
> extends Map<ICTokenDictKeys<T>, ICTokenMetaComputed> {
  private readonly _substrings = new Set<string>();

  constructor(dict: T, readonly type: U, options?: CTokenDefOptions) {
    super(
      Object.entries(dict).map(([key, value]) => {
        const isIndexOnly = typeof value === "number";
        const token = {
          name: isIndexOnly ? key : value.name ?? key,
          type,
          id: type + (isIndexOnly ? value : value.index),
        } as ICTokenMetaComputed;

        Object.defineProperty(token, "index", {
          configurable: true,
        });

        return [key as ICTokenDictKeys<T>, token];
      })
    );

    // Compute substrings
    if (options?.substrings) {
      for (const key of this.keys()) {
        (key as string).split("").reduce((substr, char) => {
          let next = substr + char;
          this._substrings.add(next);
          return next;
        }, "");
      }
    }
  }

  has(key: string): key is ICTokenDictKeys<T> {
    return super.has(key as ICTokenDictKeys<T>);
  }

  get<K extends ICTokenDictKeys<T>>(key: K): ICTokenDictComputed<T, U>[K];
  get(key: string): ICTokenMetaComputed | undefined;
  get(key: ICTokenDictKeys<T>): ICTokenMetaComputed | undefined {
    return super.get(key);
  }

  hasPrefix(substr: string): boolean {
    return this._substrings.has(substr);
  }

  static make<T extends Readonly<ICTokenDict>, U extends Readonly<CLexemeType>>(
    dict: T,
    type: U,
    options?: CTokenDefOptions
  ) {
    return new CTokenDef<T, U>(dict, type, options);
  }
}
