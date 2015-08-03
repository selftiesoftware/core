package com.repocad.web.evaluating

import com.repocad.web.evaluating.Evaluator._
import com.repocad.web.parsing._
import org.scalamock.scalatest.MockFactory
import org.scalatest.{Matchers, FlatSpec}

/**
 * Tests that the evaluator can evaluate [[com.repocad.web.parsing.Expr]]
 */
class ExprTest extends FlatSpec with MockFactory with Matchers {

  val emptyEnv : Env = Map[String, Any]()

  "An expression evaluator" should "evaluate an empty block expression" in {
    eval(BlockExpr(Seq()), emptyEnv) should equal (Right(emptyEnv -> Unit))
  }
  it should "evaluate a non-empty block expression" in {
    eval(BlockExpr(Seq(IntExpr(1))), emptyEnv) should equal (Right(emptyEnv -> 1))
  }
  it should "evaluate a call expression" in {
    val funEnv = Map("f" -> ((env : Env, a : Int) => a))
    eval(CallExpr("f", IntType, Seq(IntExpr(1))), funEnv) should equal(Right(funEnv -> 1))
  }
  it should "evaluate a def expression" in {
    eval(DefExpr("test", IntExpr(1)), emptyEnv) should equal (Right(Map("test" -> 1) -> 1))
  }
  it should "evaluate a function expression" in {
    val fun = (env : Env, a : Int) => a
    val output = eval(FunctionExpr("f", Seq(RefExpr("a", IntType)), RefExpr("a", IntType)), emptyEnv).right.get
    output._1.get("f") should equal(Some(output._2))
    output._2.asInstanceOf[Function2[Env, Int, Int]](emptyEnv, 2) should equal (2)
  }
  it should "evaluate a reference expression" in {
    val valEnv = Map("a" -> 1)
    eval(RefExpr("a", IntType), valEnv) should equal(Right(valEnv, 1))
  }
  it should "evaluate a unit expression" in {
    eval(UnitExpr, emptyEnv) should equal(Right(Map() -> Unit))
  }

  /*
  "A control expression evaluator" should "evaluate an if statement where the condition is true" in {
    eval(IfExpr(BooleanExpr(true), IntExpr(1), None, IntType), emptyEnv) should equal(Right(emptyEnv -> 1))
  }
  it should "evaluate an if statement where the condition is false but the else does not exist" in {
    eval(IfExpr(BooleanExpr(false), IntExpr(1), None, IntType), emptyEnv) should equal(Right(emptyEnv -> Unit))
  }
  it should "evaluate an if statement where the condition is false and the else body exists" in {
    eval(IfExpr(BooleanExpr(false), IntExpr(1), Some(IntExpr(2)), IntType), emptyEnv) should equal(Right(emptyEnv -> 2))
  }
  it should "evaluate a loop expression with a false condition" in {
    eval(LoopExpr(BooleanExpr(false), IntExpr(1), IntType), emptyEnv) should equal(Right(emptyEnv -> Unit))
  }*/
//  it should "evaluate a loop once" in {
//    val loopCondition = BlockExpr(Seq())
//    eval(LoopExpr())
//  }

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