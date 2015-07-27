package com.repocad.web.parsing

class ReferenceTest extends ParsingTest {

  "Reference parsing" should "reference an existing definition" in {
    parseString("a", Map("a" -> IntExpr(1))).right.get._1 should equal(RefExpr("a", IntType))
  }
  it should "reference an existing function" in {
    parseString("f()", Map("f" -> FunctionExpr("f", Seq(), IntExpr(1)))).right.get._1 should equal(CallExpr("f", IntType, Seq()))
  }
  it should "reference an existing function with one parameter" in {
    parseString("f(2)", Map("f" -> FunctionExpr("f", Seq(RefExpr("a", IntType)), IntExpr(1)))).right.get._1 should equal(CallExpr("f", IntType, Seq(IntExpr(2))))
  }
  it should "fail to reference an existing function with different number of parameters" in {
    parseString("f()", Map("f" -> FunctionExpr("f", Seq(RefExpr("a", IntType)), IntExpr(1)))) should equal(Left(Error.EXPECTED_PARAMETER_NUMBER("f", 1, 0)))
  }
  it should "fail when referencing non-existing parameters in the function body" in {
    parseString("def a(b as Int) = c") should equal(Left(Error.REFERENCE_NOT_FOUND("c")))
  }

}
