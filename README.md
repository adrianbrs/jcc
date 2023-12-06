# JCC - ~~GNU~~ JavaScript Compiler Collection

> Case study of a minimalist C compiler built in JavaScript

### Installing dependencies

```bash
> npm install
```

### Build & Run

#### Build

```bash
> npm run build
```

#### Build (watch mode)

```bash
> npm run build:watch
```

#### Start

```bash
> npm start
```

or

```bash
> npm exec jcc
```

#### Start (development mode)

```bash
> npm run start:dev
```

### Aliasing

#### Local

```bash
> alias jcc="npm exec jcc"
> jcc --help
```

#### Global

```bash
> npm link
> jcc --help
```

## Commands

```bash
> jcc
Usage: jcc [options] [command]

Case study of a minimalist C compiler built in JavaScript

Options:
  -V, --version                output the version number
  -h, --help                   display help for command

Commands:
  lexeme [options] <filepath>  Extract lexemes from source code
  help [command]               display help for command
```

### Lexemes

```bash
> jcc lexeme --help
Usage: jcc lexeme [options] <filepath>

Extract lexemes from source code

Arguments:
  filepath                   Path to source code file

Options:
  -V, --version              output the version number
  -e, --encoding <encoding>  Encoding of source code file (default: "utf-8")
  -ll, --log-level           Minimum log level to display (choices: "error", "warn", "note", "log", "all", "none")
  -h, --help                 display help for command
```

Example:

```bash
> jcc lexeme examples/ExemploParaTabelaDeIdentificadores.c
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:2:4]
2000 identifier "num1" [examples/ExemploParaTabelaDeIdentificadores.c:2:9]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:2:10]
1026 struct "struct" [examples/ExemploParaTabelaDeIdentificadores.c:3:7]
2000 identifier "data" [examples/ExemploParaTabelaDeIdentificadores.c:3:12]
5000 l_brace "{" [examples/ExemploParaTabelaDeIdentificadores.c:4:2]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:5:8]
2000 identifier "dia" [examples/ExemploParaTabelaDeIdentificadores.c:5:12]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:5:13]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:6:8]
2000 identifier "mes" [examples/ExemploParaTabelaDeIdentificadores.c:6:12]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:6:13]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:7:8]
2000 identifier "ano" [examples/ExemploParaTabelaDeIdentificadores.c:7:12]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:7:13]
5001 r_brace "}" [examples/ExemploParaTabelaDeIdentificadores.c:8:2]
2000 identifier "datanasc" [examples/ExemploParaTabelaDeIdentificadores.c:8:11]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:8:12]
1012 float "float" [examples/ExemploParaTabelaDeIdentificadores.c:10:6]
2000 identifier "calcula" [examples/ExemploParaTabelaDeIdentificadores.c:10:14]
5004 l_paren "(" [examples/ExemploParaTabelaDeIdentificadores.c:10:15]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:10:18]
2000 identifier "p1" [examples/ExemploParaTabelaDeIdentificadores.c:10:21]
5008 comma "," [examples/ExemploParaTabelaDeIdentificadores.c:10:22]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:10:26]
5021 star "*" [examples/ExemploParaTabelaDeIdentificadores.c:10:28]
2000 identifier "p2" [examples/ExemploParaTabelaDeIdentificadores.c:10:30]
5005 r_paren ")" [examples/ExemploParaTabelaDeIdentificadores.c:10:31]
5000 l_brace "{" [examples/ExemploParaTabelaDeIdentificadores.c:11:2]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:12:8]
2000 identifier "r" [examples/ExemploParaTabelaDeIdentificadores.c:12:10]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:12:11]
2000 identifier "r" [examples/ExemploParaTabelaDeIdentificadores.c:13:6]
5011 equal "=" [examples/ExemploParaTabelaDeIdentificadores.c:13:8]
2000 identifier "p1" [examples/ExemploParaTabelaDeIdentificadores.c:13:11]
5021 star "*" [examples/ExemploParaTabelaDeIdentificadores.c:13:13]
2000 identifier "p2" [examples/ExemploParaTabelaDeIdentificadores.c:13:16]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:13:17]
1021 return "return" [examples/ExemploParaTabelaDeIdentificadores.c:14:11]
2000 identifier "r" [examples/ExemploParaTabelaDeIdentificadores.c:14:13]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:14:14]
5001 r_brace "}" [examples/ExemploParaTabelaDeIdentificadores.c:15:2]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:16:4]
2000 identifier "main" [examples/ExemploParaTabelaDeIdentificadores.c:16:9]
5004 l_paren "(" [examples/ExemploParaTabelaDeIdentificadores.c:16:10]
5005 r_paren ")" [examples/ExemploParaTabelaDeIdentificadores.c:16:11]
5000 l_brace "{" [examples/ExemploParaTabelaDeIdentificadores.c:17:2]
1003 char "char" [examples/ExemploParaTabelaDeIdentificadores.c:18:9]
2000 identifier "livro" [examples/ExemploParaTabelaDeIdentificadores.c:18:15]
5002 l_bracket "[" [examples/ExemploParaTabelaDeIdentificadores.c:18:16]
3000 number_literal "100" [examples/ExemploParaTabelaDeIdentificadores.c:18:19]
5003 r_bracket "]" [examples/ExemploParaTabelaDeIdentificadores.c:18:20]
5002 l_bracket "[" [examples/ExemploParaTabelaDeIdentificadores.c:18:21]
3000 number_literal "255" [examples/ExemploParaTabelaDeIdentificadores.c:18:24]
5003 r_bracket "]" [examples/ExemploParaTabelaDeIdentificadores.c:18:25]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:18:26]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:19:8]
2000 identifier "num1" [examples/ExemploParaTabelaDeIdentificadores.c:19:13]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:19:14]
1012 float "float" [examples/ExemploParaTabelaDeIdentificadores.c:20:10]
2000 identifier "num2" [examples/ExemploParaTabelaDeIdentificadores.c:20:15]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:20:16]
2000 identifier "num2" [examples/ExemploParaTabelaDeIdentificadores.c:21:9]
5011 equal "=" [examples/ExemploParaTabelaDeIdentificadores.c:21:11]
2000 identifier "calcula" [examples/ExemploParaTabelaDeIdentificadores.c:21:19]
5004 l_paren "(" [examples/ExemploParaTabelaDeIdentificadores.c:21:20]
2000 identifier "num1" [examples/ExemploParaTabelaDeIdentificadores.c:21:24]
5008 comma "," [examples/ExemploParaTabelaDeIdentificadores.c:21:25]
2000 identifier "num2" [examples/ExemploParaTabelaDeIdentificadores.c:21:30]
5005 r_paren ")" [examples/ExemploParaTabelaDeIdentificadores.c:21:31]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:21:32]
1015 if "if" [examples/ExemploParaTabelaDeIdentificadores.c:22:7]
5004 l_paren "(" [examples/ExemploParaTabelaDeIdentificadores.c:22:9]
2000 identifier "num2" [examples/ExemploParaTabelaDeIdentificadores.c:22:13]
5005 r_paren ")" [examples/ExemploParaTabelaDeIdentificadores.c:22:14]
5000 l_brace "{" [examples/ExemploParaTabelaDeIdentificadores.c:23:6]
1017 int "int" [examples/ExemploParaTabelaDeIdentificadores.c:24:12]
2000 identifier "p1" [examples/ExemploParaTabelaDeIdentificadores.c:24:15]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:24:16]
2000 identifier "p1" [examples/ExemploParaTabelaDeIdentificadores.c:25:11]
5015 slash_equal "/=" [examples/ExemploParaTabelaDeIdentificadores.c:25:14]
2000 identifier "num2" [examples/ExemploParaTabelaDeIdentificadores.c:25:19]
5009 semicolon ";" [examples/ExemploParaTabelaDeIdentificadores.c:25:20]
5001 r_brace "}" [examples/ExemploParaTabelaDeIdentificadores.c:26:6]
5001 r_brace "}" [examples/ExemploParaTabelaDeIdentificadores.c:27:2]
```

### Syntax analisys

```bash
> jcc sint --help
Usage: jcc sint [options] <filepath>

Perform syntactic analysis on the source file

Arguments:
  filepath                   Path to source code file

Options:
  -e, --encoding <encoding>  Encoding of source code file (default: "utf-8")
  -h, --help                 display help for command
```
