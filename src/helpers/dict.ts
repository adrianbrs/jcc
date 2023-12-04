import { JCCError } from "@/errors/jcc.error.js";
import { JCCDictRule } from "@/modules/dict.js";

export function assertRule(rule: JCCDictRule, ...id: number[]) {
  if (!checkRule(rule, ...id)) {
    throw new JCCError(
      `expected rules ${id.map((n) => `'${n}'`).join(", ")}; got '${
        rule.name
      }'`,
      {
        details: {
          rule,
          names: id,
        },
      }
    );
  }
}

export function checkRule(rule: JCCDictRule, ...ids: number[]) {
  return ids.includes(rule.id);
}
