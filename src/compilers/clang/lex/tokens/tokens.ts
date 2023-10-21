import { CLexemeType } from "../interfaces/lexeme-type.interface";
import { CTokenDef, ICTokenDictKeys } from "../token-def";

export const C_TOKENS = CTokenDef.make(
  {
    "{": {
      index: 0,
      name: "l_brace",
    },
    "}": {
      index: 1,
      name: "r_brace",
    },
    "[": {
      index: 2,
      name: "l_bracket",
    },
    "]": {
      index: 3,
      name: "r_bracket",
    },
    "(": {
      index: 4,
      name: "l_paren",
    },
    ")": {
      index: 5,
      name: "r_paren",
    },
    "?": {
      index: 6,
      name: "question",
    },
    ".": {
      index: 7,
      name: "point",
    },
    ",": {
      index: 8,
      name: "comma",
    },
    ";": {
      index: 9,
      name: "semicolon",
    },
    ":": {
      index: 10,
      name: "colon",
    },
    "=": {
      index: 11,
      name: "equal",
    },
    "+=": {
      index: 12,
      name: "plus_equal",
    },
    "-=": {
      index: 13,
      name: "minus_equal",
    },
    "*=": {
      index: 14,
      name: "star_equal",
    },
    "/=": {
      index: 15,
      name: "slash_equal",
    },
    "%=": {
      index: 16,
      name: "percent_equal",
    },
    "&=": {
      index: 17,
      name: "ampersand_equal",
    },
    "|=": {
      index: 18,
      name: "pipe_equal",
    },
    "+": {
      index: 19,
      name: "plus",
    },
    "-": {
      index: 20,
      name: "minus",
    },
    "*": {
      index: 21,
      name: "star",
    },
    "/": {
      index: 22,
      name: "slash",
    },
    "%": {
      index: 23,
      name: "percent",
    },
    "++": {
      index: 24,
      name: "plus_plus",
    },
    "--": {
      index: 25,
      name: "minus_minus",
    },
    "&": {
      index: 26,
      name: "ampersand",
    },
    "|": {
      index: 27,
      name: "pipe",
    },
    "^": {
      index: 28,
      name: "caret",
    },
    "~": {
      index: 29,
      name: "tilde",
    },
    "<<": {
      index: 30,
      name: "l_shift",
    },
    ">>": {
      index: 31,
      name: "r_shift",
    },
    "==": {
      index: 32,
      name: "equal_equal",
    },
    "!=": {
      index: 33,
      name: "exclamation_equal",
    },
    "<": {
      index: 34,
      name: "less",
    },
    ">": {
      index: 35,
      name: "greater",
    },
    "<=": {
      index: 36,
      name: "less_equal",
    },
    ">=": {
      index: 37,
      name: "greater_equal",
    },
    "&&": {
      index: 38,
      name: "ampersand_ampersand",
    },
    "||": {
      index: 39,
      name: "pipe_pipe",
    },
    "!": {
      index: 40,
      name: "exclamation",
    },
  } as const,
  {
    substrings: true,
  }
);

export type CToken = ICTokenDictKeys<typeof C_TOKENS>;
