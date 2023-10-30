import { IJCCReader } from "@/interfaces/jcc-reader.interface.js";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface.js";
import { CDefineDirectiveLexConsumer } from "./directives/c-define-directive.lex-consumer.js";
import { isAlphaNumeric } from "@/helpers/string.js";
import { ICPreprocessorConstantMap } from "./interfaces/preprocessor-constants.interface.js";
import { CIncludeDirectiveLexConsumer } from "./directives/c-include-directive.lex-consumer.js";

export class CDirectivesLexConsumer implements ICLexConsumer {
  private readonly directives: Record<string, ICLexConsumer> = {
    define: new CDefineDirectiveLexConsumer(),
    include: new CIncludeDirectiveLexConsumer(),
  };

  constructor(readonly constants: ICPreprocessorConstantMap) {}

  async consume(_: string, reader: IJCCReader): Promise<false | ICLexeme> {
    let name = "";

    for await (const next of reader) {
      if (!isAlphaNumeric(next)) {
        reader.unshift(next);
        break;
      }

      name += next;
    }

    const directive = this.directives[name];

    // Directive not found
    if (!directive) {
      reader.raise(`invalid preprocessing directive #${name}`, {
        byteStart: reader.state.byte - (name.length - 1),
      });
    }

    return directive.consume(name, reader);
  }
}
