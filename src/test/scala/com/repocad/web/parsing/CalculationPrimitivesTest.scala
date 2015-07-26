package com.repocad.web.parsing

class CalculationPrimitivesTest extends ParsingTest {

  "A parser using default calculation primitives" should "parse a plus function" in {
    testEquals(CallExpr("+", NumberType, Seq(IntExpr(10), IntExpr(10))), "10 + 10")
  }


}
