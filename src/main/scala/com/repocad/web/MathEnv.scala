package com.repocad.web

import com.repocad.web.evaluating.Evaluator


object MathEnv {
  lazy val toEnv : Evaluator.Env = {
    Map(
      "sin" -> ((degrees : Double) => math.sin(degrees))
    )
  }
}
