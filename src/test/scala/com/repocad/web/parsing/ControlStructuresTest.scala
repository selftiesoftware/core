package com.repocad.web.parsing

class ControlStructuresTest extends ParsingTest {

  "Control structure parsing" should "parse an if statement without an else block" in {
    parseString("if (true) 1", Map()).right.get._1 should equal(IfExpr(BlockExpr(Seq(BooleanExpr(true))), IntExpr(1), UnitExpr, AnyType))
  }
  it should "parse an if statment with an else block" in {
    parseString("if (false) 1 else 2", Map()).right.get._1 should equal(IfExpr(BlockExpr(Seq(BooleanExpr(false))), IntExpr(1), IntExpr(2), IntType))
  }
  it should "fail to parse an if statement with a condition that is not boolean" in {
    parseString("if (1) 1 else 2", Map()) should equal(Left(Error.TYPE_MISMATCH(BooleanType.toString, IntType.toString)))
  }

}
