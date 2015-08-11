package com.repocad.web.parsing

import com.repocad.web.Environment

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
  it should "fail when giving a wrongly typed argument to a function" in {
    parseString("{ def a(b as Int) = b a(\"hi\") }") should equal(Left(Error.TYPE_MISMATCH("IntType", "StringType")))
  }
  it should "infer a super type of a typed argument in a function" in {
    parseString("{ def a(b as Number) = 1 a(3) }", Map(), defaultTypeEnv) should equal(
      Right(BlockExpr(Seq(FunctionExpr("a", Seq(RefExpr("b", NumberType)), IntExpr(1)), CallExpr("a", IntType, Seq(IntExpr(3))))), Map(), defaultTypeEnv)
    )
  }

}
