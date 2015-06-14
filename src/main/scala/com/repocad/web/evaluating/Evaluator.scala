package com.repocad.web.evaluating

import com.repocad.web.parsing._
import com.repocad.web.{Printer, _}

/**
 * An evaluator to evaluate a list of [[Expr]]
 */
object Evaluator {

  // TODO: Lazy evaluation

  type Env = Map[String, Type]

  type Value = Either[String, (Env, Type)]

  private var scriptEnv : Map[String, Env] = Map()

  def eval(expr : Expr, printer : Printer[_]) : Value = {
    try {
      eval(expr, printer.toEnv ++ RepoMath.toEnv).left.map(e => {
        println("Error when evaluating: " + e)
        e
      })
    } catch {
      case e : Exception => {
        Left(s"Failure when evaluating script: ${e.getLocalizedMessage}")
      }
    }
  }

  protected[evaluating] def eval(expr: Expr, env : Env) : Value = {
    expr match {

      /*
      case ImportExpr(name) =>
        if (scriptEnv.contains(name)) {
          Right(scriptEnv(name) ++ env -> Unit)
        } else {
          Ajax.get("http://siigna.com:20004/get/" + name) match {
            case Response(_, 4, text) =>
              Parser.parse(Lexer.lex(text)).right.flatMap(expr => {
                eval(expr, Printer.dummyEnv).right.map(v => {
                  scriptEnv += (name -> v._1)
                  (v._1 ++ env) -> Unit
                })
              })
            case xs => Left(s"Script $name failed to load with error: $xs")
          }
        }

      case FunctionExpr(name, params, body) =>
        val function = params.size match {
          case 0 => (funEnv : Env) => eval(body, funEnv).fold(l => l, r => r._2)
          case 1 => (funEnv : Env, a: Any) => {
            eval(body, funEnv.+(params(0) -> a)).fold(l => l, r => r._2)
          }
          case 2 => (funEnv : Env, a: Any, b: Any) => eval(body, funEnv.+(params(0) -> a, params(1) -> b)).fold(l => l, r => r._2)
          case 3 => (funEnv : Env, a: Any, b: Any, c: Any) => eval(body, funEnv.+(params(0) -> a, params(1) -> b, params(2) -> c)).fold(l => l, r => r._2)
          case 4 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any) => eval(body, funEnv.+(params(0) -> a, params(1) -> b, params(2) -> c, params(3) -> d)).fold(l => l, r => r._2)
          case 5 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any, e: Any) => eval(body, funEnv.+(params(0) -> a, params(1) -> b, params(2) -> c, params(3) -> d, params(4) -> e)).fold(l => l, r => r._2)
          case 6 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any, e: Any, f: Any) => eval(body, funEnv.+(params(0) -> a, params(1) -> b, params(2) -> c, params(3) -> d, params(4) -> e, params(5) -> f)).fold(l => l, r => r._2)
          case x => Left("Unsupported number of arguments: " + x)
        }
        Right(env.+(name -> function) -> function)

      case ConstantExpr(value) => Right(env -> value)

      case CompExpr(e1, e2, op) =>
        eval(e1, env).fold(e => Left(e), v1 => eval(e2, v1._1).fold(e => Left(e), v2 => {
          val n1 = v1._2.asInstanceOf[Double]
          val n2 = v2._2.asInstanceOf[Double]
          op match {
            case ">" => Right(env -> (n1 > n2))
            case "<" => Right(env -> (n1 < n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))

      case IfExpr(condition, ifBody, elseBody) => {
        eval(condition, env) match {
          case Left(thisIsBad) => Left(thisIsBad)
          case Right((conditionEnvironment, true)) => {
            eval(ifBody, conditionEnvironment)
          }
          case Right((conditionEnvironment, false)) => {
            elseBody match {
              case Some(body) /* Somebody, somebody, somebody put something in my drink */ =>
                eval(body, conditionEnvironment)
              case None => Right(env -> Unit)
            }
          }
          case Right((newEnvironment, value)) => Left("Expected boolean, got " + value)
        }
      }

      case OpExpr(e1, e2, op) =>
        eval(e1, env).right.flatMap(v1 => eval(e2, v1._1).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Double]
          val n2 = v2._2.asInstanceOf[Double]
          op match {
            case "-" => Right(env -> (n1 - n2))
            case "+" => Right(env -> (n1 + n2))
            case "*" => Right(env -> (n1 * n2))
            case "/" => Right(env -> (n1 / n2))
            case x => Left(s"Unknown arithmetic operator $x")
          }
        }))

      case RangeExpr(name, from, to) =>
        val fromOption: Either[String, Double] = env.get(name).map {
          case i: Int => Right(i + 1d)
          case i: Double => Right(i + 1)
          case x => Left(s"Cannot parse $x to int")
        }.getOrElse(getValue[Double](from, env))

        val toOption = getValue[Double](to, env)
        fromOption.right.flatMap(fromValue => toOption.right.flatMap(toValue => {
          Right((env + (name -> fromValue)) -> (fromValue <= toValue))
        }))

      case RefExpr(name, params) =>
        env.get(name).fold[Value](Left(s"Failed to find function '$name'. Please check if it has been declared.")) {
          case f: Function1[Env, Any] => Right(env -> f(env))
          case f: Function2[Env, Any, Any] =>
            eval(params(0), env).right.flatMap(a => Right(a._1 -> f.apply(env, a._2)))
          case f: Function3[Env, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                Right(b._1 -> f.apply(env, a._2, b._2))
              )
            )
          case f: Function4[Env, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c => {
                  Right(c._1 -> f.apply(env, a._2, b._2, c._2))}
                )
              )
            )
          case f: Function5[Env, Any, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c =>
                  eval(params(3), c._1).right.flatMap(d => {
                    Right(d._1 -> f.apply(env, a._2, b._2, c._2, d._2))
                  })
                )
              )
            )
          case f: Function6[Env, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c =>
                  eval(params(3), c._1).right.flatMap(d =>
                    eval(params(4), d._1).right.flatMap(e =>
                      Right(e._1 -> f.apply(env, a._2, b._2, c._2, d._2, e._2))
                    )
                  )
                )
              )
            )
          case f: Function7[Env, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c =>
                  eval(params(3), c._1).right.flatMap(d =>
                    eval(params(4), d._1).right.flatMap(e =>
                      eval(params(5), e._1).right.flatMap(g =>
                        Right(g._1 -> f.apply(env, a._2, b._2, c._2, d._2, e._2, g._2))
                      )
                    )
                  )
                )
              )
            )
          case f: Function8[Env, Any, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c =>
                  eval(params(3), c._1).right.flatMap(d =>
                    eval(params(4), d._1).right.flatMap(e =>
                      eval(params(5), e._1).right.flatMap(g =>
                        eval(params(6), g._1).right.flatMap(h =>
                          Right(h._1 -> f.apply(env, a._2, b._2, c._2, d._2, e._2, g._2, h._2))
                        )
                      )
                    )
                  )
                )
              )
            )
          case f: Function9[Env, Any, Any, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env).right.flatMap(a =>
              eval(params(1), a._1).right.flatMap(b =>
                eval(params(2), b._1).right.flatMap(c =>
                  eval(params(3), c._1).right.flatMap(d =>
                    eval(params(4), d._1).right.flatMap(e =>
                      eval(params(5), e._1).right.flatMap(g =>
                        eval(params(6), g._1).right.flatMap(h =>
                          eval(params(7), h._1).right.flatMap(i =>
                            Right(i._1 -> f.apply(env, a._2, b._2, c._2, d._2, e._2, g._2, h._2, i._2))
                          )
                        )
                      )
                    )
                  )
                )
              )
            )

          case x => Left("Expected callable function, got " + x)
        }

      case RefExpr(name) =>
        env.get(name).fold[Value](
          Left(s"Failed to find function '$name'. Please check if it has been declared.")
        )(x => Right(env -> x))

      case seq: BlockExpr =>
        def foldRecursive(it: Iterator[Expr], foldEnv: Env): Value = {
          eval(it.next(), foldEnv).fold(error => Left(error), t => {
            if (it.hasNext) {
              foldRecursive(it, t._1)
            } else {
              Right(t._1 -> t._2)
            }
          })
        }
        foldRecursive(seq.expr.iterator, env)

      case UnitExpr => Right(env -> Unit)

      case ValExpr(name, valExpr) =>
        eval(valExpr, env).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case LoopExpr(condition: Expr, body: Expr) =>
        /* Note to self: Too much recursion error when looping recursively */
        var loopEnv: Map[String, Any] = env
        var lastResult: Any = Unit
        var lastError: Option[String] = None
        def getCondition = eval(condition, loopEnv).fold(error => {
          lastError = Some(error); false
        }, v => {
          loopEnv = v._1
          v._2.asInstanceOf[Boolean]
        })
        while (lastError.isEmpty && getCondition) {
          eval(body, loopEnv).fold(s => {
            lastError = Some(s); s
          }, x => {
            lastResult = x._2
            loopEnv = x._1
          })
        }
        lastError.map(Left(_)).getOrElse(Right(loopEnv.filter(t => env.contains(t._1)) -> lastResult))

      */

      case x => Left(s"Unknown expression $x")
    }
  }

  def getValue[Expected](expr : Expr, expectedT : Expected, env : Env) : Either[String, Expected] = {
    if (expr.t == expectedT) {
      eval(expr, env) match {
        case Right((_, t : Expected)) => Right(t)
        case fail => Left(s"Failed to read value from $expr, failed with: $fail")
      }
    } else {
      Left(s"Found type ${expr.t}, but expected $expectedT")
    }
  }

}
