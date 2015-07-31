package com.repocad.web.evaluating

import com.repocad.web.{Printer, Environment}
import com.repocad.web.evaluating.Evaluator._
import com.repocad.web.parsing.{IntExpr, NumberType, CallExpr, BlockExpr}
import org.scalamock.scalatest.MockFactory
import org.scalatest.{Matchers, FlatSpec}

class PrimitivesTest extends FlatSpec with MockFactory with Matchers {

  val mockPrinter : Printer[Any] = mock[Printer[Any]]
  val defaultEnv = Environment.getEvaluatorEnv(mockPrinter)

  "An evaluator for primitive expressions" should "evaluate a plus expression" in {
    eval(CallExpr("+", NumberType, Seq(IntExpr(2), IntExpr(3))), defaultEnv) should equal (Right(defaultEnv -> 5))
  }
}
