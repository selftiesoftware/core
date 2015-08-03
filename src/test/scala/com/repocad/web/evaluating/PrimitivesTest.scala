package com.repocad.web.evaluating

import com.repocad.web.{Printer, Environment}
import com.repocad.web.evaluating.Evaluator._
import com.repocad.web.parsing._
import org.scalamock.scalatest.MockFactory
import org.scalatest.{Matchers, FlatSpec}

class PrimitivesTest extends FlatSpec with MockFactory with Matchers {

  val mockPrinter : Printer[Any] = mock[Printer[Any]]
  val defaultEnv = Environment.getEvaluatorEnv(mockPrinter)

  def evalPrimitive[T](operand : String, arg1 : Int, arg2 : Int, expected : T) = {
    eval(CallExpr(operand, NumberType, Seq(IntExpr(arg1), IntExpr(arg2))), defaultEnv) should equal (Right(defaultEnv -> expected))
    eval(CallExpr(operand, NumberType, Seq(FloatExpr(arg1), FloatExpr(arg2))), defaultEnv) should equal (Right(defaultEnv -> expected))
    eval(CallExpr(operand, NumberType, Seq(IntExpr(arg1), FloatExpr(arg2))), defaultEnv) should equal (Right(defaultEnv -> expected))
    eval(CallExpr(operand, NumberType, Seq(FloatExpr(arg1), FloatExpr(arg2))), defaultEnv) should equal (Right(defaultEnv -> expected))
  }

  "An evaluator for primitive expressions" should "evaluate a plus expression" in {
    evalPrimitive("+", 2, 3, 5)
  }
  it should "evaluate a minus expression" in {
    evalPrimitive("-", 2, 3, -1)
  }
  it should "evaluate a times expression" in {
    evalPrimitive("*", 2, 3, 6)
  }
  it should "evaluate a division expression" in {
    evalPrimitive("/", 3, 2, 1.5)
  }
  it should "evaluate a less-than expression" in {
    evalPrimitive("<", 2, 2, false)
  }
  it should "evaluate a less-than-equals expression" in {
    evalPrimitive("<=", 2, 2, true)
  }
  it should "evaluate a greater-than expression" in {
    evalPrimitive(">", 2, 2, false)
  }
  it should "evaluate a greater-than-equals expression" in {
    evalPrimitive(">=", 2, 2, true)
  }
}
