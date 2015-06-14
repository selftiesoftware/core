package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  val toEnv : Evaluator.Env = Map(
    /*"cos" -> ((_ : Evaluator.Env, degrees : Double) => math.cos(degrees)),
    "degrees" -> ((_ : Evaluator.Env, degrees : Double) => math.toDegrees(degrees)),
    "sin" -> ((_ : Evaluator.Env, degrees : Double) => math.sin(degrees)),
    "radians" -> ((_ : Evaluator.Env, degrees : Double) => math.toRadians(degrees)),
    "tan" -> ((_ : Evaluator.Env, degrees : Double) => math.tan(degrees)),
    "toInt" -> ((_ : Evaluator.Env, double : Double) => double.toInt)*/
  )

}
