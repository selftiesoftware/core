package com.repocad.web

import com.repocad.reposcript.Renderer
import com.repocad.reposcript.evaluating.EvaluatorEnv
import com.repocad.reposcript.parsing._

import scala.math.BigDecimal.RoundingMode

/**
  * An environment containing defaults for use in the [[com.repocad.reposcript.parsing.Parser]] and
  * [[com.repocad.reposcript.evaluating.Evaluator]].
  */
object Environment {

  type EnvMap = Traversable[(String, (Expr, Any))]

  private val primitiveEnv: EnvMap = Traversable(
    // Calculation primitives
    "+" ->(FunctionType("+", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberType),
      (env: EvaluatorEnv, a: Double, b: Double) => a + b),
//    "+" ->(FunctionType("+", Seq(RefExpr("first", AnyType), RefExpr("second", StringType)), StringType),
//      (env: EvaluatorEnv, a: Any, b: String) => a.toString + b),
//    "+" ->(FunctionType("+", Seq(RefExpr("first", StringType), RefExpr("second", AnyType)), StringType),
//      (env: EvaluatorEnv, a: String, b: Any) => a + b.toString),
    "-" ->(FunctionType("-", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberType),
      (env: EvaluatorEnv, a: Double, b: Double) => a - b),
    "*" ->(FunctionType("*", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberType),
      (env: EvaluatorEnv, a: Double, b: Double) => a * b),
    "/" ->(FunctionType("/", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), NumberType),
      (env: EvaluatorEnv, a: Double, b: Double) => a / b),
    "<" ->(FunctionType("<", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanType),
      (env: EvaluatorEnv, a: Double, b: Double) => a < b),
    "<=" ->(FunctionType("<=", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanType),
      (env: EvaluatorEnv, a: Double, b: Double) => a <= b),
    ">" ->(FunctionType(">", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanType),
      (env: EvaluatorEnv, a: Double, b: Double) => b < a),
    ">=" ->(FunctionType(">=", Seq(RefExpr("first", NumberType), RefExpr("second", NumberType)), BooleanType),
      (env: EvaluatorEnv, a: Double, b: Double) => b <= a),
    // Trigonometry
    "cos" ->(FunctionType("cos", Seq(RefExpr("degrees", NumberType)), NumberType),
      (_: EvaluatorEnv, degrees: Double) => math.cos(degrees)),
    "degrees" ->(FunctionType("degrees", Seq(RefExpr("degrees", NumberType)), NumberType),
      (_: EvaluatorEnv, degrees: Double) => math.toDegrees(degrees)),
    "sin" ->(FunctionType("sin", Seq(RefExpr("degrees", NumberType)), NumberType),
      (_: EvaluatorEnv, degrees: Double) => math.sin(degrees)),
    "tan" ->(FunctionType("tan", Seq(RefExpr("degrees", NumberType)), NumberType),
      (_: EvaluatorEnv, degrees: Double) => math.tan(degrees)),
    "radians" ->(FunctionType("radians", Seq(RefExpr("degrees", NumberType)), NumberType),
      (_: EvaluatorEnv, degrees: Double) => math.toRadians(degrees)),
    // Mathematics
    "abs" ->(FunctionType("sqrt", Seq(RefExpr("x", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double) => math.abs(x)),
    "ceil" ->(FunctionType("ceil", Seq(RefExpr("x", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double) => math.ceil(x)),
    "floor" ->(FunctionType("floor", Seq(RefExpr("x", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double) => math.floor(x)),
    "sqrt" ->(FunctionType("sqrt", Seq(RefExpr("x", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double) => math.sqrt(x)),
    "round" ->(FunctionType("round", Seq(RefExpr("x", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double) => math.round(x)),
    "round" ->(FunctionType("round", Seq(RefExpr("x", NumberType), RefExpr("decimals", NumberType)), NumberType),
      (_: EvaluatorEnv, x: Double, y: Double) => BigDecimal(x).setScale(y.toInt, RoundingMode.HALF_EVEN).doubleValue())
  )

  val evaluatorEnv: EvaluatorEnv = {
    primitiveEnv.foldLeft(EvaluatorEnv.empty)((env, kv) => {
      val function = kv._2._1.asInstanceOf[FunctionType]
      env.add(kv._1, function.params, function.returnType, kv._2._2)
    })
  }

  // String types plus primitive operations plus printer operations
  val parserEnv: ParserEnv = {
    val typeEnv = ParserEnv.ofMap(stringTypeMap.map(t => t._1.toLowerCase() -> t._2))
    val primEnv = primitiveEnv.foldLeft(typeEnv)((env, kv) => env.+(kv._1, kv._2._1))
    val renderEnv = Renderer.toParserEnv
    primEnv ++ renderEnv
  }

}
