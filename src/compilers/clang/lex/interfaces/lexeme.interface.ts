import {
  IJCCLexConsumer,
  IJCCLexeme,
} from "@/interfaces/jcc-lex-generator.interface";
import { CLexemeType } from "./lexeme-type.interface";

export interface ICLexeme extends IJCCLexeme {
  id: number;
  type: CLexemeType;
  name: string;
}

export type ICLexConsumer = IJCCLexConsumer<ICLexeme>;
