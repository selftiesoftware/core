package com.repocad.web

import com.repocad.reposcript.evaluating.Evaluator
import com.repocad.reposcript.parsing._
import com.repocad.reposcript.{Renderer, evaluating}

class EnvironmentTest extends ParsingTest {

  val mockRenderer = mock[Renderer]
  override val emptyEnv = Environment.parserEnv

  private def testEnvironment(input: String, expectedExpr: Expr, expectedValue: Any): Unit = {
    val expr = parseString(input)
    expr.right.get.expr should equal(expectedExpr)
    new Evaluator(parser, Environment.evaluatorEnv).eval(expr.right.get.expr, mockRenderer).right.get._2 should equal(expectedValue)
  }

  "The RepoCad environment" should "add two numbers together" in {
    testEnvironment("1 + 2", CallExpr("+", NumberType, Seq(NumberExpr(1), NumberExpr(2))), 3)
  }
  it should "subtract two numbers together" in {
    testEnvironment("1 - 2", CallExpr("-", NumberType, Seq(NumberExpr(1), NumberExpr(2))), -1)
  }
  it should "time two numbers together" in {
    testEnvironment("1 * 2", CallExpr("*", NumberType, Seq(NumberExpr(1), NumberExpr(2))), 2)
  }
  it should "divide two numbers" in {
    testEnvironment("1 / 2", CallExpr("/", NumberType, Seq(NumberExpr(1), NumberExpr(2))), 0.5)
  }
  it should "test if one number is less than another" in {
    testEnvironment("1 < 2", CallExpr("<", BooleanType, Seq(NumberExpr(1), NumberExpr(2))), true)
  }
  it should "test if one number is less than or equals to another" in {
    testEnvironment("1 <= 1", CallExpr("<=", BooleanType, Seq(NumberExpr(1), NumberExpr(1))), true)
  }
  it should "test if one number is bigger than another" in {
    testEnvironment("1 > 2", CallExpr(">", BooleanType, Seq(NumberExpr(1), NumberExpr(2))), false)
  }
  it should "test if one number is bigger than or equals to another" in {
    testEnvironment("1 >= 1", CallExpr(">=", BooleanType, Seq(NumberExpr(1), NumberExpr(1))), true)
  }
  it should "take the cosine of a number" in {
    testEnvironment("cos(3)", CallExpr("cos", NumberType, Seq(NumberExpr(3))), math.cos(3))
  }
  it should "take the sine of a number" in {
    testEnvironment("sin(2)", CallExpr("sin", NumberType, Seq(NumberExpr(2))), math.sin(2))
  }
  it should "take the tangens of a number" in {
    testEnvironment("tan(21)", CallExpr("tan", NumberType, Seq(NumberExpr(21))), math.tan(21))
  }
  it should "convert radians to degrees" in {
    testEnvironment("todegrees(5)", CallExpr("todegrees", NumberType, Seq(NumberExpr(5))), math.toDegrees(5))
  }
  it should "convert degrees to radians" in {
    testEnvironment("toradians(210)", CallExpr("toradians", NumberType, Seq(NumberExpr(210))), math.toRadians(210))
  }
  it should "take the absolute of a number" in {
    testEnvironment("abs(-210)", CallExpr("abs", NumberType, Seq(NumberExpr(-210))), 210)
  }
  it should "take the ceil of a number" in {
    testEnvironment("ceil(23.1)", CallExpr("ceil", NumberType, Seq(NumberExpr(23.1))), 24)
  }
  it should "take the floor of a number" in {
    testEnvironment("floor(82.9)", CallExpr("floor", NumberType, Seq(NumberExpr(82.9))), 82)
  }
  it should "take the square root of a number" in {
    testEnvironment("sqrt(10)", CallExpr("sqrt", NumberType, Seq(NumberExpr(10))), math.sqrt(10))
  }
  it should "round a number" in {
    testEnvironment("round(82131.123)", CallExpr("round", NumberType, Seq(NumberExpr(82131.123))), 82131)
  }
  it should "round a number to a decimal" in {
    testEnvironment("round(82131.123 2)", CallExpr("round", NumberType, Seq(NumberExpr(82131.123), NumberExpr(2))), 82131.12)
  }

}
