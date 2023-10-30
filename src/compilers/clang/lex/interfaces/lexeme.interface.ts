import {
  IJCCLexConsumer,
  IJCCLexeme,
} from "@/interfaces/jcc-lex-generator.interface.js";
import { CLexemeType } from "./lexeme-type.interface.js";

export interface ICLexeme extends IJCCLexeme {
  id: number;
  type: CLexemeType;
  name: string;
}

export type ICLexConsumer = IJCCLexConsumer<ICLexeme>;
