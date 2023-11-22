export enum CLexemeType {
  KEYWORD = 1000,
  IDENTIFIER = 2000,
  NUMBER_LITERAL = 2001,
  STRING_LITERAL = 2002,
  CHAR_LITERAL = 2003,
  TOKEN = 3000,
}

export namespace CLexemeType {
  export function getName(type: CLexemeType): string {
    return CLexemeType[type].toLowerCase();
  }
}
