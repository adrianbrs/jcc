export const C_KEYWORDS = {
  auto: 0,
  break: 1,
  case: 2,
  char: 3,
  const: 4,
  continue: 5,
  default: 6,
  do: 7,
  double: 8,
  else: 9,
  enum: 10,
  extern: 11,
  float: 12,
  for: 13,
  goto: 14,
  if: 15,
  int: 16,
  long: 17,
  register: 18,
  return: 19,
  short: 20,
  signed: 21,
  sizeof: 22,
  static: 23,
  struct: 24,
  switch: 25,
  typedef: 26,
  union: 27,
  unsigned: 28,
  void: 29,
  volatile: 30,
  while: 31,
};

export type CKeyword = keyof typeof C_KEYWORDS;

export function isCKeyword(word: string): word is CKeyword {
  return word in C_KEYWORDS;
}
