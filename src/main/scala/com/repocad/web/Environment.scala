package com.repocad.web

import com.repocad.reposcript.Printer
import com.repocad.reposcript.evaluating.{EvaluatorEnv, Signature}
import com.repocad.reposcript.parsing._

/**
  * An environment containing defaults for use in the [[com.repocad.reposcript.parsing.Parser]] and
  * [[com.repocad.reposcript.evaluating.Evaluator]].
  */
object Environment {

  type EnvMap = Map[String, (Expr, Any)]

  private val BooleanTypeExpr = new Expr {
    val t = BooleanType
  }
  private val NumberTypeExpr = new Expr {
    val t = NumberType
  }

  private val primitiveEnv: EnvMap = Map(
    // Calculation primitives
    "+" ->(FunctionType("+", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.plus(a, b)),
    "-" ->(FunctionType("-", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.minus(a, b)),
    "*" ->(FunctionType("*", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.times(a, b)),
    "/" ->(FunctionType("/", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.divide(a, b)),
    "<" ->(FunctionType("<", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.lessThan(a, b)),
    "<=" ->(FunctionType("<=", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.lessThanEquals(a, b)),
    ">" ->(FunctionType(">", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.lessThan(b, a)),
    ">=" ->(FunctionType(">=", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanTypeExpr),
      (env: EvaluatorEnv, a: Any, b: Any) => RepoMath.lessThanEquals(b, a)),
    // Trigonometry
    "cos" ->(FunctionType("cos", Seq(RefExpr("degrees", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, degrees: Double) => math.cos(degrees)),
    "degrees" ->(FunctionType("degrees", Seq(RefExpr("degrees", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, degrees: Double) => math.toDegrees(degrees)),
    "sin" ->(FunctionType("sin", Seq(RefExpr("degrees", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, degrees: Double) => math.sin(degrees)),
    "radians" ->(FunctionType("radians", Seq(RefExpr("degrees", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, degrees: Double) => math.toRadians(degrees)),
    "tan" ->(FunctionType("tan", Seq(RefExpr("degrees", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, degrees: Double) => math.tan(degrees)),
    "toInt" ->(FunctionType("toInt", Seq(RefExpr("number", NumberType)), NumberTypeExpr),
      (_: EvaluatorEnv, double: Double) => double.toInt)
  )

  lazy val evaluatorEnv: EvaluatorEnv = new EvaluatorEnv(
    primitiveEnv.map(t => {
      val functionType = t._2._1.asInstanceOf[FunctionType]
      Signature(t._1.toLowerCase(), functionType.params.map(_.t), functionType.returnType) -> t._2._2
    })
  )

  // String types plus primitive operations plus printer operations
  lazy val parserEnv: ParserEnv =
    ParserEnv.ofMap(stringTypeMap.map(t => t._1.toLowerCase() -> t._2) ++ primitiveEnv.map(t => t._1.toLowerCase() -> t._2._1)) ++ Printer.toParserEnv

}
