import { IJCCReader } from "@/interfaces/jcc-reader.interface";
import { ICLexConsumer, ICLexeme } from "./interfaces/lexeme.interface";
import { CDefineDirectiveLexConsumer } from "./directives/c-define-directive.lex-consumer";
import { isAlphaNumeric } from "@/helpers/string";
import { ICPreprocessorConstantMap } from "./interfaces/preprocessor-constants.interface";

export class CDirectivesLexConsumer implements ICLexConsumer {
  private readonly directives: Record<string, ICLexConsumer> = {
    define: new CDefineDirectiveLexConsumer(),
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
