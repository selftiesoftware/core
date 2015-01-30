package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  val toEnv : Evaluator.Env = Map(
    "cos" -> ((p : Printer, degrees : Double) => math.cos(degrees)),
    "sin" -> ((p : Printer, degrees : Double) => math.sin(degrees)),
    "tan" -> ((p : Printer, degrees : Double) => math.tan(degrees))
  )

}
