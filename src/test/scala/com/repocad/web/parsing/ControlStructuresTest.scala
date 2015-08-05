package com.repocad.web.parsing

class ControlStructuresTest extends ParsingTest {

  def testCode(code : String, expected : Expr) = parseString(code, Map()) should equal(Right(expected, Map(), defaultTypeEnv))
  def testCode(code : String, expected : String) = parseString(code, Map()) should equal(Left(expected))

  "Control structure parsing" should "parse an if statement without an else block" in {
    testCode("if (true) 1", IfExpr(BlockExpr(Seq(BooleanExpr(true))), IntExpr(1), UnitExpr, AnyType))
  }
  it should "parse an if statment with an else block" in {
    testCode("if (false) 1 else 2", IfExpr(BlockExpr(Seq(BooleanExpr(false))), IntExpr(1), IntExpr(2), IntType))
  }
  it should "fail to parse an if statement with a condition that is not boolean" in {
    testCode("if (1) 1 else 2", Error.TYPE_MISMATCH(BooleanType.toString, IntType.toString))
  }
  it should "parse a loop statement with an unnamed loop variable" in {
    testCode("repeat 5",
      LoopExpr(DefExpr("_loopCounter", IntExpr(1)), IntExpr(5), UnitExpr))
  }
  it should "parse a loop statement with an unnamed loop variable and a fixed range" in {
    testCode("repeat 1 to 5", LoopExpr(DefExpr("_loopCounter", IntExpr(1)), IntExpr(5), UnitExpr))
  }
  it should "parse a loop statement with named loop variable" in {
    testCode("repeat 5 using counter",
      LoopExpr(DefExpr("counter", IntExpr(1)), IntExpr(5), UnitExpr))
  }
  it should "parse a loop statement with named loop variable and a fixed range" in {
    testCode("repeat 2 to 5 using counter",
      LoopExpr(DefExpr("counter", IntExpr(2)), IntExpr(5), UnitExpr))
  }

}
