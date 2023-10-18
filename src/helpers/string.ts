export function isLetter(char: string): boolean {
  return /[a-zA-Z]/.test(char);
}

export function isAlpha(char: string): boolean {
  return /[a-zA-Z_]/.test(char);
}

export function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

export function isHexDigit(char: string): boolean {
  return /[0-9a-fA-F]/.test(char);
}

export function isOctalDigit(char: string): boolean {
  return /[0-7]/.test(char);
}

export function isBinaryDigit(char: string): boolean {
  return /[0-1]/.test(char);
}

export function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}

export function isNumberSign(char: string): boolean {
  return char === "+" || char === "-";
}

export function isNumberSeparator(char: string): boolean {
  return char === ".";
}

export function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}
