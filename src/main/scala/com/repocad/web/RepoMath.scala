package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  def lt(a: Any, b: Any) : Any = {
    numberOp(a, b, (x, y) => x < y)
  }

  def plus(a : Any, b : Any) : Any = {
    numberOp(a, b, (x, y) => x + y)
  }

  private def numberOp[T](a : Any, b : Any, f : (Double, Double) => T) : T =
    (a, b) match {
      case x : (Int, Int) => f(x._1, x._2)
      case x : (Double, Int) => f(x._1, x._2)
      case x : (Int, Double) => f(x._1, x._2)
      case x : (Double, Double) => f(x._1, x._2)
    }

  val toEnv : evaluating.Env = Map(
    /*"cos" -> ((_ : Evaluator.Env, degrees : Double) => math.cos(degrees)),
    "degrees" -> ((_ : Evaluator.Env, degrees : Double) => math.toDegrees(degrees)),
    "sin" -> ((_ : Evaluator.Env, degrees : Double) => math.sin(degrees)),
    "radians" -> ((_ : Evaluator.Env, degrees : Double) => math.toRadians(degrees)),
    "tan" -> ((_ : Evaluator.Env, degrees : Double) => math.tan(degrees)),
    "toInt" -> ((_ : Evaluator.Env, double : Double) => double.toInt)*/
  )

}
