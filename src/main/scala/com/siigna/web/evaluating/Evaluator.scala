package com.siigna.web.evaluating

import com.siigna.web.parsing._
import org.scalajs.dom.CanvasRenderingContext2D

/**
 * An evaluator to evaluate a given list of [[Expr]] on the 
 * @param context  The graphical context to interact with.
 */
class Evaluator(context: CanvasRenderingContext2D) {

  type Env = Map[String, Any]

  type Value = Either[String, (Env, Any)]

  def eval(expr: Expr, env : Env) : Value = {
    expr match {
      case LineExpr(e1, e2, e3, e4) =>
        getValue[Int](e1, env).right.flatMap(x1 =>
          getValue[Int](e2, env).right.flatMap(y1 =>
            getValue[Int](e3, env).right.flatMap(x2 =>
              getValue[Int](e4, env).right.flatMap(y2 => {
                context.beginPath()
                context.moveTo(x1, y1)
                context.lineTo(x2, y2)
                context.stroke()
                context.closePath()
                Right(env -> Unit)
              })
            )
          )
        )

      case ConstantExpr(value) => Right(env -> value)

      case CompExpr(e1, e2, op) =>
        eval(e1, env).fold(e => Left(e), v1 => eval(e2, v1._1).fold(e => Left(e), v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case ">" => Right(env -> (n1 > n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))

      case OpExpr(e1, e2, op) =>
        eval(e1, env).right.flatMap(v1 => eval(e2, v1._1).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case "-" => Right(env -> (n1 - n2))
            case "*" => Right(env -> (n1 * n2))
            case x => Left(s"Unknown arithmetic operator $x")
          }
        }))

      case RangeExpr(name, from, to) =>
        val fromOption = env.get(name).map {
          case i: Int => Right(i + 1)
          case x => Left(s"Cannot parse $x to int")
        }.getOrElse(getValue[Int](from, env))
        val toOption = getValue[Int](to, env)
        fromOption.right.flatMap(fromValue => toOption.right.flatMap(toValue => {
          Right((env + (name -> fromValue)) -> (fromValue < toValue))
        }))

      case RefExpr(name) =>
        env.get(name).fold[Value](Left(s"Failed to find variable '$name'. Please check if it has been declared."))(s => Right(env -> s))

      case seq : SeqExpr =>
        def foldRecursive(it : Iterator[Expr], foldEnv : Env) : Value = {
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

      case ValExpr(name, value) =>
        eval(value, env).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case LoopExpr(condition : Expr, body : Expr) =>
        /* Note to self: Too much recursion error when looping recursively */
        var loopEnv : Map[String, Any] = env
        var lastResult : Any = Unit
        var lastError : Option[String] = None
        def getCondition = eval(condition, loopEnv).fold(error => {lastError = Some(error); false}, v => {
          loopEnv = v._1
          v._2.asInstanceOf[Boolean]
        })
        while (lastError.isEmpty && getCondition) {
          eval(body, loopEnv).fold(s => {lastError = Some(s); s}, x => {
            lastResult = x._2
            loopEnv = x._1
          })
        }
        lastError.map(Left(_)).getOrElse(Right(loopEnv -> lastResult))

      case x => Left("Unknown expression " + x)
    }

  }

  def getValue[T : Manifest](expr : Expr, env : Env) : Either[String, T] = {
    eval(expr, env) match {
      case Right((_, t : T)) => Right(t)
      case fail => Left(s"Failed to read value from $expr, failed with: $fail")
    }
  }

}