package com.repocad.web.parsing

import com.repocad.web.Environment
import com.repocad.web.lexing.Lexer

class CalculationPrimitivesTest extends ParsingTest {

  "A parser using default calculation primitives" should "parse a plus function" in {
    parseString("10 + 10", Environment.getParserEnv).right.get._1 should equal (CallExpr("+", NumberType, Seq(IntExpr(10), IntExpr(10))))
  }


}
