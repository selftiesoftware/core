package com.repocad.web.parsing

import com.repocad.web.Environment
import com.repocad.web.lexing.Lexer

class CalculationPrimitivesTest extends ParsingTest {

  def testCallExpr(input : String, a : Int, b : Int, op : String, typ : Type) =
    parseString("10 + 10", Environment.getParserEnv).right.get._1 should equal (CallExpr(op, typ, Seq(IntExpr(a), IntExpr(b))))

  "A parser using default calculation primitives" should "parse a plus function" in {
    testCallExpr("10 + 10", 10, 10, "+", NumberType)
  }
  it should "parse a minus function" in {
    testCallExpr("10 - 10", 10, 10, "-", NumberType)
  }
  it should "parse a times function" in {
    testCallExpr("10 * 10", 10, 10, "*", NumberType)
  }
  it should "parse a division function" in {
    testCallExpr("10 / 10", 10, 10, "/", NumberType)
  }
  it should "parse a less-than function" in {
    testCallExpr("10 < 10", 10, 10, "<", BooleanType)
  }
  it should "parse a less-than-equals function" in {
    testCallExpr("10 <= 10", 10, 10, "<=", BooleanType)
  }
  it should "parse a greater-than function" in {
    testCallExpr("10 > 10", 10, 10, ">", BooleanType)
  }
  it should "parse a greater-than-equals function" in {
    testCallExpr("10 >= 10", 10, 10, ">=", BooleanType)
  }


}
