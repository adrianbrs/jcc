#include <stdio.h>

int a = 1, b = 2;
int a;

// error: conflicting types for 'a'; have 'float'
// float a;

// error: syntax error, expected ...
// {}

int test(), test2(), x = 3;

// error: function 'test' is initialized like a variable
// int z, test() = 3;

int main()
{
  int a;
  int b = 3, c;

  // error: redeclaration of 'a'
  // int a;

  // error: redefinition of 'a'
  // int a = 2;

  while (1)
    ;
  while (0)
    continue;
  while (0)
    break;

  while (1)
  {
    int a = 2;
    while (2)
    {
      int a = 3;

      while (3)
      {
        break;
      }

      break;
    }

    continue;
  }

  // error: continue statement not within a loop
  // continue;

  // error: break statement not within loop or switch
  // break;

  {
    int a, b;
    {
      {
        {
          while (1)
            a;
        }
      }
    }
  }
}