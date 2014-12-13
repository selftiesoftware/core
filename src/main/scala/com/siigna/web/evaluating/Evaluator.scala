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
        val x1 = getValue[Int](e1, env).right.get
        val y1 = getValue[Int](e2, env).right.get
        val x2 = getValue[Int](e3, env).right.get
        val y2 = getValue[Int](e4, env).right.get
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
        context.closePath()
        Right(env -> Unit)

      case ConstantExpr(value) => {
        Right(env -> value)
      }

      case CompExpr(e1, e2, op) =>
        eval(e1, env).right.flatMap(v1 => eval(e2, v1._1).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case ">" => Right(env -> (n1 > n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))

      case OpExpr(e1, e2, op) => {
        eval(e1, env).right.flatMap(v1 => eval(e2, v1._1).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case "-" => Right(env -> (n1 - n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))
      }

      case RefExpr(name) => {
        env.get(name).fold[Value](Left("Failed to find variable of name " + name))(s => Right(env -> s))
      }

      case seq : SeqExpr =>
        var lastResult : Any = Unit
        val m = seq.expr.foldLeft(env)((map : Map[String, Any], ex : Expr) => {
          val res = eval(ex, map)
          if (res.isRight) {
            lastResult = res.right.get._2
          }
          res.fold(s => map, x => x._1)
        })
        // Todo: Smart to return the entire env from the block? Consider intersections
        Right(m -> lastResult)

      case UnitExpr => Right(env -> Unit)

      case ValExpr(name, value) =>
        eval(value, env).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case WhileExpr(condition : Expr, body : Expr) =>
        var loopEnv : Map[String, Any] = env
        def getCondition = eval(condition, loopEnv).fold(_ => false, v => {
          v._2.asInstanceOf[Boolean]
        })
        while (getCondition) {
          loopEnv = eval(body, loopEnv).fold(s => loopEnv, x => {
            x._1
          })
        }
        Right(loopEnv -> Unit)

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