package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing
import com.repocad.web.parsing.Parser.{FailureCont, SuccessCont, Value, TypeEnv, ValueEnv}
import org.scalatest.{FlatSpec, Matchers}

class DefinitionTest extends FlatSpec with Matchers {

  val mockSuccess : SuccessCont = (e, v, t, s) => Right(e, v, t)
  val mockFailure : FailureCont = s => Left(s)

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, Map(), parsing.typeEnv).right.map(_._1)
    println("output: ", either)
    either should equal(Right(expected))
  }

  def parseString(string : String, valueEnv : ValueEnv = Map(), typeEnv : TypeEnv = Map()) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }

  /* Values */
  "A parser for definitions" should "parse a definition" in {
    testEquals(DefExpr("a", IntExpr(10)), "def a = 10")
  }
  it should "parse a definition with type information" in {
    testEquals(DefExpr("a", IntExpr(10)), "def a as Int = 10")
  }
  it should "store a value in the value environment" in {
    parseString("def a = 10") should equal (Right(DefExpr("a", IntExpr(10)), Map("a" -> IntExpr(10)), Map[String, Type]()))
  }
  it should "fail when wrong type is specified" in {
    parseString("def a as Unit = 1").isLeft should equal (true)
  }

  /* Functions */
  "A parser for functions" should "parse a function without parameters and body" in {
    testEquals(FunctionExpr("a", Seq(), UnitExpr), "def a() = ")
  }
  it should "parse a function with one parameter and no body" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType)), UnitExpr), "def a(b as Int) = ")
  }
  it should "parse a function without a parameter but with a body" in {
    testEquals(FunctionExpr("a", Seq(), BlockExpr(Seq(DefExpr("b", DoubleExpr(10.2))))), "def a() = { def b = 10.2 }")
  }
  it should "parse a function with two parameters and no body" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType), RefExpr("c", DoubleType)), UnitExpr), "def a(b as Int c as Double) = ")
  }
  it should "parse a function with three parameters and no body" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType), RefExpr("c", DoubleType), RefExpr("d", StringType)), UnitExpr), "def a(b as Int c as Double d as String) = ")
  }
  it should "parse a function with four parameters and no body" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType), RefExpr("c", DoubleType), RefExpr("d", StringType), RefExpr("e", BooleanType)), UnitExpr), "def a(b as Int c as Double d as String e as Boolean) = ")
  }
  it should "parse a function with a prepended parameter" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType)),UnitExpr), "def (b as Int)a = ")
  }
  it should "store a function in the value environment" in {
    val function = FunctionExpr("a", Seq(), UnitExpr)
    parseString("def a() = ") should equal (Right(function, Map("a" -> function), Map()))
  }
  it should "accept references to existing parameters in the function body" in {
    val function = FunctionExpr("a", Seq(RefExpr("b", IntType)), RefExpr("b", IntType))
    testEquals(function, "def a(b as Int) = b")
  }
  it should "fail when referencing non-existing parameters in the function body" in {
    parseString("def a(b as Int) = c") should equal(Left(Error.REFERENCE_NOT_FOUND("c")))
  }

}
