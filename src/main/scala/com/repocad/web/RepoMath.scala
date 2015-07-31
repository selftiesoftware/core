package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  def plus(a : Any, b : Any) : Any = {
    (a, b) match {
      case x : (Int, Int) => x._1 + x._2
      case x : (Double, Int) => x._1 + x._2
      case x : (Int, Double) => x._1 + x._2
      case x : (Double, Double) => x._1 + x._2
    }
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
