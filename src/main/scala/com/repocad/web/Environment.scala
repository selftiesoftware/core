package com.repocad.web

import com.repocad.web.parsing._

/**
 * An environment containing defaults for use in the [[com.repocad.web.parsing.Parser]] and
 * [[com.repocad.web.evaluating.Evaluator]].
 */
object Environment {

  private lazy val parserValueEnv : parsing.ValueEnv = Map(
    "+" -> FunctionExpr("+", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = NumberType }),
    "-" -> FunctionExpr("-", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = NumberType }),
    "*" -> FunctionExpr("*", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = NumberType }),
    "/" -> FunctionExpr("/", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = NumberType }),
    "<" -> FunctionExpr("<", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = BooleanType }),
    "<=" -> FunctionExpr("<", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = BooleanType }),
    ">" -> FunctionExpr(">", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = BooleanType }),
    ">=" -> FunctionExpr(">=", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), new Expr { val t = BooleanType }),
    "line" -> FunctionExpr("line", Seq(RefExpr("x1", NumberType), RefExpr("y1", NumberType), RefExpr("x2", NumberType), RefExpr("y2", NumberType)), UnitExpr)
  )

  private lazy val evaluatorEnv : evaluating.Env = Map(
    "+" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.plus(a, b)),
    "-" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.minus(a, b)),
    "*" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.times(a, b)),
    "/" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.divide(a, b)),
    "<" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.lessThan(a, b)),
    "<=" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.lessThanEquals(a, b)),
    ">" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.lessThan(b, a)),
    ">=" -> ((env : evaluating.Env, a : Any, b : Any) => RepoMath.lessThanEquals(b, a))
  )

  def getParserEnv : parsing.ValueEnv = parserValueEnv

  def getEvaluatorEnv(printer : Printer[_]) : evaluating.Env = {
    evaluatorEnv ++ printer.toEnv
  }

}
