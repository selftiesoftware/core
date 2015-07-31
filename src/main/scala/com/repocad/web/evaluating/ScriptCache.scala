package com.repocad.web.evaluating

import com.repocad.web.parsing
import com.repocad.web.parsing.{Expr, RemoteParser}

/**
 * A script cache intended to cache scripts from remote repositories.
 */
object ScriptCache {

  private var cache : Map[String, (Env, Any)] = Map()

  def get(script : String, env : Env) : Either[String, (Env, Any)] = {
    cache.get(script) match {
      case Some(value) => Right(value)
      case _ =>
        RemoteParser.get(script).right.flatMap(t => evaluateScript(t._1, t._2, env)).right.map(value => {
          cache = cache.+(script -> value)
          value
        })
    }
  }

  def evaluateScript(expr : Expr, valueEnv : parsing.ValueEnv, env : Env): Value = {
    val newEnv = valueEnv.mapValues((expr : Expr) => Evaluator.eval(expr, env)).collect {
      case (s, Left(x : String)) => return Left[String, (Env, Any)](x)
      case (s, Right(x : (Env, Any))) => s -> x
    }
    Evaluator.eval(expr, newEnv).right.map(tuple => newEnv ++ tuple._1 -> tuple._2)
  }

}
