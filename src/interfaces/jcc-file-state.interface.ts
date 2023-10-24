export interface IJCCFileState {
  /**
   * The path to the file being read.
   */
  filepath: string;

  /**
   * The encoding of the file being read.
   */
  encoding: BufferEncoding;

  /**
   * The current byte being read.
   */
  byte: number;

  /**
   * The current line number being read.
   */
  line: number;

  /**
   * The current column number being read.
   */
  column: number;
}
