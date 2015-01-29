package com.repocad.web

import com.repocad.web.evaluating.Evaluator

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  val toEnv : Evaluator.Env = Map(
    "cos" -> ((degrees : Double) => math.cos(degrees))
  )

}
