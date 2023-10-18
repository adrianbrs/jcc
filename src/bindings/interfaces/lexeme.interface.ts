import {
  IJCCLexConsumer,
  IJCCLexeme,
} from "@/interfaces/jcc-lex-generator.interface";
import { CLexemeType } from "./lexeme-type.interface";

export interface ICLexeme extends IJCCLexeme {
  type: CLexemeType;
}

export type ICLexConsumer = IJCCLexConsumer<ICLexeme>;
