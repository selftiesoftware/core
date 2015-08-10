package com.repocad.web.evaluating

import com.repocad.web.Printer
import com.repocad.web.evaluating.Evaluator._
import com.repocad.web.parsing._
import org.scalamock.scalatest.MockFactory
import org.scalatest.{FlatSpec, Matchers}

/**
  * Tests that the evaluator can evaluate [[com.repocad.web.parsing.Expr]]
  */
class ControlsExprTest extends FlatSpec with MockFactory with Matchers {

  val emptyEnv : Env = Map[String, Any]()
  val mockPrinter : Printer[Any] = mock[Printer[Any]]
  val mockEnv : Env = Map("line" -> ((funEnv : Env, a : Double, b : Double, c : Double, d : Double) => mockPrinter.line(a, b, c, d)))

   "A control expression evaluator" should "evaluate an if statement where the condition is true" in {
     eval(IfExpr(BooleanExpr(true), IntExpr(1), UnitExpr, AnyType), emptyEnv) should equal(Right(emptyEnv -> 1))
   }
   it should "evaluate an if statement where the condition is false but the else does not exist" in {
     eval(IfExpr(BooleanExpr(false), IntExpr(1), UnitExpr, AnyType), emptyEnv) should equal(Right(emptyEnv -> Unit))
   }
   it should "evaluate an if statement where the condition is false and the else body exists" in {
     eval(IfExpr(BooleanExpr(false), IntExpr(1), IntExpr(2), IntType), emptyEnv) should equal(Right(emptyEnv -> 2))
   }
   it should "evaluate a loop expression with a false condition" in {
     eval(LoopExpr(DefExpr("a", IntExpr(1)), IntExpr(2), IntExpr(3)), emptyEnv) should equal(Right(emptyEnv -> 3))
   }
   it should "evaluate a loop once" in {
     eval(LoopExpr(DefExpr("a", FloatExpr(1)), IntExpr(2),
       CallExpr("line", UnitType, Seq(RefExpr("a", FloatType), FloatExpr(3), FloatExpr(4), FloatExpr(5)))), mockEnv)
   }

 //  "evaluate an import statement" in {
 //
 //  }

   "A value evaluator" should "evaluate a boolean expression" in {
     eval(BooleanExpr(false), emptyEnv) should equal(Right(emptyEnv -> false))
   }
   it should "evaluate a float expression" in {
     eval(FloatExpr(2.2), emptyEnv) should equal(Right(emptyEnv -> 2.2))
   }
   it should "evaluate a int expression" in {
     eval(IntExpr(2), emptyEnv) should equal(Right(emptyEnv -> 2))
   }
   it should "evaluate a string expression" in {
     eval(StringExpr("hi"), emptyEnv) should equal(Right(emptyEnv -> "hi"))
   }

 }