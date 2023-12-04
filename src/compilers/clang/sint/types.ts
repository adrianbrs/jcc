import { ICLexeme } from "../lex/interfaces/lexeme.interface.js";
import { ICTokenMetaComputed } from "../lex/token-def.js";
import { C_KEYWORDS } from "../lex/lexemes/keywords.js";

const dataTypes = new Set<number>([
  C_KEYWORDS.get("char").id,
  C_KEYWORDS.get("int").id,
  C_KEYWORDS.get("float").id,
  C_KEYWORDS.get("double").id,
]);

const defaultModifiers: Record<number, [ICTokenMetaComputed] | undefined> = {
  [C_KEYWORDS.get("int").id]: [C_KEYWORDS.get("signed")],
  [C_KEYWORDS.get("short").id]: [C_KEYWORDS.get("int")],
  [C_KEYWORDS.get("long").id]: [C_KEYWORDS.get("int")],
  [C_KEYWORDS.get("signed").id]: [C_KEYWORDS.get("int")],
  [C_KEYWORDS.get("unsigned").id]: [C_KEYWORDS.get("int")],
  [C_KEYWORDS.get("char").id]: [C_KEYWORDS.get("signed")],
  // TODO: add other types
};

const allowedModifiers: Record<number, Set<number> | undefined> = {
  [C_KEYWORDS.get("int").id]: new Set([
    C_KEYWORDS.get("signed").id,
    C_KEYWORDS.get("unsigned").id,
    C_KEYWORDS.get("short").id,
    C_KEYWORDS.get("long").id,
  ]),
  [C_KEYWORDS.get("signed").id]: new Set([
    C_KEYWORDS.get("int").id,
    C_KEYWORDS.get("char").id,
    C_KEYWORDS.get("short").id,
    C_KEYWORDS.get("long").id,
  ]),
  [C_KEYWORDS.get("unsigned").id]: new Set([
    C_KEYWORDS.get("int").id,
    C_KEYWORDS.get("char").id,
    C_KEYWORDS.get("short").id,
  ]),
  [C_KEYWORDS.get("short").id]: new Set([
    C_KEYWORDS.get("int").id,
    C_KEYWORDS.get("char").id,
    C_KEYWORDS.get("long").id,
    C_KEYWORDS.get("signed").id,
    C_KEYWORDS.get("unsigned").id,
  ]),
  [C_KEYWORDS.get("long").id]: new Set([
    C_KEYWORDS.get("int").id,
    C_KEYWORDS.get("signed").id,
    C_KEYWORDS.get("unsigned").id,
  ]),
  [C_KEYWORDS.get("char").id]: new Set([
    C_KEYWORDS.get("signed").id,
    C_KEYWORDS.get("unsigned").id,
    C_KEYWORDS.get("short").id,
  ]),
  // TODO: add other types
};

export function normalizeType(type: ICLexeme[]) {
  const normalized: ICLexeme[] = [];
  const idSet = new Set<number>();

  for (const lexeme of type) {
    const modifiers = defaultModifiers[lexeme.id] ?? [];
    for (const modifier of modifiers) {
      if (idSet.has(modifier.id)) {
        continue;
      }
      idSet.add(modifier.id);
      normalized.push({
        ...modifier,
        value: modifier.name,
      });
    }

    if (idSet.has(lexeme.id)) {
      continue;
    }
    idSet.add(lexeme.id);
    normalized.push(lexeme);
  }

  return normalized.sort((a, b) => a.id - b.id);
}

export function getPrimitiveType(type: ICLexeme[]) {
  return type.find((lexeme) => dataTypes.has(lexeme.id));
}

export function isTypeEqual(typeA: ICLexeme[], typeB: ICLexeme[]) {
  const normalizedA = normalizeType(typeA);
  const normalizedB = normalizeType(typeB);
  if (normalizedA.length !== normalizedB.length) {
    return false;
  }
  return normalizedA.every(
    (lexeme, index) => lexeme.id === normalizedB[index].id
  );
}

export function isTypeValid(type: ICLexeme[]) {
  const normalized = normalizeType(type);
  let allowed = allowedModifiers[normalized[0].id];

  if (normalized.length === 1 && dataTypes.has(normalized[0].id)) {
    return true;
  }

  if (!allowed) {
    return false;
  }

  const intersection = (a?: Set<number>, b?: Set<number>) => {
    if (!(a && b)) {
      return;
    }

    const result = new Set<number>();
    if (a.size < b.size) {
      a.forEach((v) => b.has(v) && result.add(v));
    } else {
      b.forEach((v) => a.has(v) && result.add(v));
    }
    return result;
  };

  return normalized.slice(1).every((lexeme) => {
    if (!allowed || !allowed.has(lexeme.id)) {
      return false;
    }

    allowed = intersection(allowed, allowedModifiers[lexeme.id]);
    return true;
  });
}

export function getTypeName(type: ICLexeme[], normalize = false) {
  return (normalize ? normalizeType(type) : type)
    .map((lexeme) => lexeme.value)
    .join(" ");
}
