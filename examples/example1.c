
#define abc(bcd) abc##bcd

#define DECLARE_AND_SET(type, varname, value) \
  type varname = value;                       \
  type orig_##varname = varname;

// char a = '';

#include <stdalign.h>

int main()
{
  double valor = 2.1;
  valor = +6.32;
  valor = valor - -35. + 0xb;
  char *str = "hello \"world\"!";
  // double a = 1.0..0..0;

  char *awdwdwd = "aaawdwd";
  // double c = +..2..2.2.2.2.22;

  int abc(1) = 1;

  DECLARE_AND_SET(char *, test, " 1,\
       2, 3 ")

  double b = 0.2;
}