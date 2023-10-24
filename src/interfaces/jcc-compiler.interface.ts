import { IJCCErrorOptions, JCCError } from "@/errors/jcc.error";
import { IJCCLexGenerator, IJCCLexeme } from "./jcc-lex-generator.interface";
import { IJCCLogger } from "./jcc-logger.interface";
import { IJCCReader } from "./jcc-reader.interface";
import { IJCCFileState } from "./jcc-file-state.interface";
import { IJCCModule } from "./jcc-module.interface";

export interface IJCCCompilerEvents<TLexeme extends IJCCLexeme = IJCCLexeme> {
  error: [error: JCCError | Error];
  warn: [message: string];
  lexeme: [lexeme: TLexeme];
}

export type IJCCCompilerEventNames<
  T extends IJCCCompilerEvents = IJCCCompilerEvents
> = keyof T;

export type IJCCCompilerEventArgs<
  T extends IJCCCompilerEvents,
  E extends IJCCCompilerEventNames<T>
> = T[E];

export interface IJCCCompilerOptions {
  /**
   * The path to the source file to read.
   */
  filepath: string;

  /**
   * The encoding of the source file to read.
   *
   * @default "utf-8"
   */
  encoding?: BufferEncoding;

  /**
   * The logger instance to use.
   *
   * @default JCCLogger
   */
  logger?: IJCCLogger;

  /**
   * The reader instance to use.
   *
   * @default JCCReader
   */
  reader?: IJCCReader;

  /**
   * The lexer instance to use.
   *
   * @default JCCLexGenerator
   */
  lexer?: IJCCLexGenerator;

  /**
   * Whether to stop on the first error.
   */
  stopOnError?: boolean;
}

export type IJCCCompilerTypes<T extends IJCCCompiler = IJCCCompiler> =
  T extends IJCCCompiler<infer TLexeme, infer TEvents>
    ? {
        lexeme: TLexeme;
        events: TEvents;
      }
    : never;

/**
 * The JCC compiler interface.
 */
export interface IJCCCompiler<
  TLexeme extends IJCCLexeme = IJCCLexeme,
  TEvents extends IJCCCompilerEvents = IJCCCompilerEvents<TLexeme>
> {
  readonly options: Readonly<IJCCCompilerOptions>;
  readonly state: Readonly<IJCCFileState>;

  // Modules
  readonly reader: IJCCReader<this>;
  readonly lexer: IJCCLexGenerator<this>;
  readonly logger: IJCCLogger<this>;

  /**
   * Creates a new `JCCError` with the current state of the reader.
   */
  makeError(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState>
  ): JCCError;

  /**
   * Creates a new `JCCError` with the current state of the reader and throws it.
   *
   * @throws {JCCError}
   */
  raise(
    message: string,
    options?: Omit<IJCCErrorOptions, keyof IJCCFileState>
  ): never;

  /**
   * Adds a listener for the given event.
   */
  on<E extends IJCCCompilerEventNames>(
    event: E,
    listener: (...args: IJCCCompilerEventArgs<TEvents, E>) => void
  ): this;

  /**
   * Adds a listener for the given event.
   */
  addListener<E extends IJCCCompilerEventNames>(
    event: E,
    listener: (...args: IJCCCompilerEventArgs<TEvents, E>) => void
  ): this;
}
