export enum CLexemeType {
  KEYWORD = 1000,
  IDENTIFIER = 2000,
  NUMBER_LITERAL = 3000,
  STRING_LITERAL = 4000,
  CHAR_LITERAL = 4001,
  TOKEN = 5000,
}

export namespace CLexemeType {
  export function getName(type: CLexemeType): string {
    return CLexemeType[type].toLowerCase();
  }
}
