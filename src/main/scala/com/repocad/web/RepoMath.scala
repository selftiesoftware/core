package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  val toEnv : Evaluator.Env = Map(
    "cos" -> ((p : Printer[_], degrees : Double) => math.cos(degrees)),
    "degrees" -> ((p : Printer[_], degrees : Double) => math.toDegrees(degrees)),
    "sin" -> ((p : Printer[_], degrees : Double) => math.sin(degrees)),
    "radians" -> ((p : Printer[_], degrees : Double) => math.toRadians(degrees)),
    "tan" -> ((p : Printer[_], degrees : Double) => math.tan(degrees)),
    "toInt" -> ((p : Printer[_], double : Double) => double.toInt)
  )

}
