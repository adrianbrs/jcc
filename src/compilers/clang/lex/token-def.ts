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

export type ICTokenDictComputed<T extends ICTokenDict> = {
  [K in keyof T]: T[K] extends number
    ? { readonly index: T[K]; readonly name: K }
    : T[K] extends ICTokenMeta
    ? {
        readonly index: T[K]["index"];
        readonly name: T[K]["name"] extends string ? T[K]["name"] : K;
      }
    : never;
};

export interface CTokenDefOptions {
  substrings?: boolean;
}

export class CTokenDef<T extends ICTokenDict = ICTokenDict> extends Map<
  ICTokenDictKeys<T>,
  ICTokenMetaComputed
> {
  private readonly _substrings = new Set<string>();

  constructor(dict: T, options?: CTokenDefOptions) {
    super(
      Object.entries(dict).map(([key, value]) => {
        const isIndexOnly = typeof value === "number";

        return [
          key as ICTokenDictKeys<T>,
          {
            index: isIndexOnly ? value : value.index,
            name: isIndexOnly ? key : value.name ?? key,
          },
        ];
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

  get<K extends ICTokenDictKeys<T>>(key: K): ICTokenDictComputed<T>[K];
  get(key: string): ICTokenMetaComputed | undefined;
  get(key: ICTokenDictKeys<T>): ICTokenMetaComputed | undefined {
    return super.get(key);
  }

  hasPrefix(substr: string): boolean {
    return this._substrings.has(substr);
  }

  static make<T extends Readonly<ICTokenDict>>(
    dict: T,
    options?: CTokenDefOptions
  ) {
    return new CTokenDef<T>(dict, options);
  }
}
