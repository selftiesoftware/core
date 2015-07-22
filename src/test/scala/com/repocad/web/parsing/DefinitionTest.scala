package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing.Parser._
import org.scalatest.EitherValues._
import org.scalatest.{FlatSpec, Matchers}

class DefinitionTest extends FlatSpec with Matchers {

  val mockSuccess : SuccessCont = (e, v, t, s) => Right(e, v, t)
  val mockFailure : FailureCont = s => Left(s)

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, Map(), Type.typeEnv).right.map(_._1)
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

  /* Functions */
  "A parser for functions" should "parse a function without parameters and body" in {
    testEquals(FunctionExpr("a", Seq(), UnitExpr), "def a() = ")
  }
  it should "parse a function with one parameter and no body" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType)), UnitExpr), "def a(b as Int) = ")
  }

}
