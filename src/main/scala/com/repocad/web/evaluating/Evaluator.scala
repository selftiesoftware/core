package com.repocad.web.evaluating

import com.repocad.web.parsing._
import com.repocad.web.{Printer, _}

/**
 * An evaluator to evaluate a list of [[com.repocad.web.parsing.Expr]]
 */
object Evaluator {

  private var scriptEnv : Map[String, Env] = Map()

  def eval(expr : Expr, printer : Printer[_]) : Value = {
    try {
      eval(expr, Environment.getParserEnv).left.map(e => {
        println("Error when evaluating: " + e)
        e
      })
    } catch {
      case e : Exception =>
        Left(s"Failure when evaluating script: ${e.getLocalizedMessage}")
    }
  }

  def eval(expr: Expr, env : Env) : Value = {
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

        */

      case v : ValueExpr[_] => Right(env -> v.value)

      case DefExpr(name, valExpr) =>
        eval(valExpr, env).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case FunctionExpr(name, params, body) =>
        val function = params.size match {
          case 0 => (funEnv : Env) => eval(body, funEnv).fold(l => l, r => r._2)
          case 1 => (funEnv : Env, a: Any) => {
            eval(body, funEnv.+(params.head.name -> a)).fold(l => l, r => r._2)
          }
          case 2 => (funEnv : Env, a: Any, b: Any) =>
            eval(body, funEnv.+(params(0).name -> a, params(1).name -> b)).fold(l => l, r => r._2)
          case 3 => (funEnv : Env, a: Any, b: Any, c: Any) =>
            eval(body, funEnv.+(params(0).name -> a, params(1).name -> b, params(2).name -> c)).fold(l => l, r => r._2)
          case 4 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any) =>
            eval(body, funEnv.+(params(0).name -> a, params(1).name -> b, params(2).name -> c, params(3).name -> d)).fold(l => l, r => r._2)
          case 5 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any, e: Any) =>
            eval(body, funEnv.+(params(0).name -> a, params(1).name -> b, params(2).name -> c, params(3).name -> d, params(4).name -> e)).fold(l => l, r => r._2)
          case 6 => (funEnv : Env, a: Any, b: Any, c: Any, d: Any, e: Any, f: Any) =>
            eval(body, funEnv.+(params(0).name -> a, params(1).name -> b, params(2).name -> c, params(3).name -> d, params(4).name -> e, params(5).name -> f)).fold(l => l, r => r._2)
          case x => Left("Unsupported number of arguments: " + x)
        }
        Right(env.+(name -> function) -> function)

      case IfExpr(condition, ifBody, elseBody, t) => {
        eval(condition, env) match {
          case Left(thisIsBad) => Left(thisIsBad)
          case Right((conditionEnvironment, true)) => {
            eval(ifBody, conditionEnvironment)
          }
          case Right((conditionEnvironment, false)) => {
            eval(elseBody, conditionEnvironment)
          }
          case Right((newEnvironment, value)) => Left("Expected boolean, got " + value)
        }
      }

      //case objectExpr : ObjectExpr => Right(env.+(objectExpr.name -> objectExpr), objectExpr)

      /*case RangeExpr(name, from, to) =>
        val fromOption: Either[String, Double] = env.get(name).map {
          case i: Int => Right(i + 1d)
          case i: Double => Right(i + 1)
          case x => Left(s"Cannot parse $x to int")
        }.getOrElse(from.value)

        val toOption = getValue[Double](to, env)
        fromOption.right.flatMap(fromValue => toOption.right.flatMap(toValue => {
          Right((env + (name -> fromValue)) -> (fromValue <= toValue))
        }))

      case RefExpr(name, t) => env.get(name).fold(Left(s"Could not find $name in scope")) {
        case
      }*/

      case CallExpr(name, t, params) =>
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
          /*case ObjectExpr(objectName, objectParams) =>
            if (params.size != objectParams.size) {
              Left(Error.OBJECT_PARAM_SIZE_NOT_EQUAL(name, objectParams.size, params.size))
            } else {
              val actualParams : Seq[Value] = params.map(eval(_, env))
              val (lefts, rights) = actualParams.partition((either : Value) => either.isLeft)
              if (lefts.nonEmpty) {
                Left(Error.OBJECT_PARAM_EVAL_ERROR(name, lefts))
              } else {
                val map = objectParams.zip(rights)
                Right(env.+(name -> map), map)
              }
            }*/

          case x => Left("Expected callable function, got " + x)
        }

      case RefExpr(name, t) =>
        env.get(name).fold[Value](
          Left(s"Failed to find function '$name'. Please check if it has been declared.")
        )(x => Right(env -> x))

      case seq: BlockExpr =>
        if (seq.expr.isEmpty) {
          Right(env, Unit)
        } else {
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
        }

      case UnitExpr => Right(env -> Unit)

      case LoopExpr(condition: Expr, body: Expr, t) =>
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

      case x => Left(s"Unknown expression $x")
    }
  }

}
