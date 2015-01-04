package com.siigna.web.evaluating

import com.siigna.web.Printer
import com.siigna.web.lexing.Lexer
import com.siigna.web.parsing._
import org.scalajs.dom
import org.scalajs.dom.extensions.Ajax
import scala.concurrent.{Future, Await}
import scala.concurrent.duration.Duration
import scala.scalajs.concurrent.JSExecutionContext.Implicits.runNow
import scala.util.Success

/**
 * An evaluator to evaluate a list of [[Expr]]
 */
object Evaluator {

  type Env = Map[String, Any]

  type Value = Either[String, (Env, Any)]

  def eval(expr: Expr, env : Env, printer : Printer) : Value = {
    expr match {

      case CircleExpr(centerX, centerY, radius) =>
        getValue[Int](centerX, env, printer).right.flatMap(x =>
          getValue[Int](centerY, env, printer).right.flatMap(y =>
            getValue[Int](radius, env, printer).right.flatMap(radiusValue => {
              printer.circle(x,y,radiusValue)
              Right(env -> Unit)
            })
          )
        )

      case LineExpr(e1, e2, e3, e4) =>
        getValue[Double](e1, env, printer).right.flatMap(x1 =>
          getValue[Double](e2, env, printer).right.flatMap(y1 =>
            getValue[Double](e3, env, printer).right.flatMap(x2 =>
              getValue[Double](e4, env, printer).right.flatMap(y2 => {
                printer.line(x1, y1, x2, y2)
                Right(env -> Unit)
              })
            )
          )
        )

      case TextExpr(centerX, centerY, height, text) =>
        getValue[Int](centerX, env, printer).right.flatMap(x =>
          getValue[Int](centerY, env, printer).right.flatMap(y =>
            getValue[Int](height, env, printer).right.flatMap(heightValue =>
              getValue[String](text, env, printer).right.flatMap(textValue => {
                printer.text(x,y,heightValue,textValue)
                Right(env -> Unit)
              })
            )
          )
        )

      case ConstantExpr(value) => Right(env -> value)

      case MessageExpr(value) => Right(env -> value)

      case CompExpr(e1, e2, op) =>
        eval(e1, env, printer).fold(e => Left(e), v1 => eval(e2, v1._1, printer).fold(e => Left(e), v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case ">" => Right(env -> (n1 > n2))
            case "<" => Right(env -> (n1 < n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))

      case OpExpr(e1, e2, op) =>
        eval(e1, env, printer).right.flatMap(v1 => eval(e2, v1._1, printer).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Int]
          val n2 = v2._2.asInstanceOf[Int]
          op match {
            case "-" => Right(env -> (n1 - n2))
            case "+" => Right(env -> (n1 + n2))
            case "*" => Right(env -> (n1 * n2))
            case "/" => Right(env -> (n1 / n2))
            case x => Left(s"Unknown arithmetic operator $x")
          }
        }))

      case ImportExpr(name) =>
        val xhr = new dom.XMLHttpRequest()
        xhr.open("GET", "http://siigna.com:20004/get/" + name.name, false) // Handle synchronously
        xhr.send()
        Parser.parse(Lexer.lex(xhr.responseText)) match {
          case Right(e) => eval(e, env, printer)
          case Left(error) => Left(s"Script $name failed to compile with error: $error")
        }

      case RangeExpr(name, from, to) =>
        val fromOption = env.get(name).map {
          case i: Int => Right(i + 1)
          case x => Left(s"Cannot parse $x to int")
        }.getOrElse(getValue[Int](from, env, printer))
        val toOption = getValue[Int](to, env, printer)
        fromOption.right.flatMap(fromValue => toOption.right.flatMap(toValue => {
          Right((env + (name -> fromValue)) -> (fromValue < toValue))
        }))

      case RefExpr(name) =>
        env.get(name).fold[Value](Left(s"Failed to find variable '$name'. Please check if it has been declared."))(s => Right(env -> s))

      case seq : SeqExpr =>
        def foldRecursive(it : Iterator[Expr], foldEnv : Env) : Value = {
          eval(it.next(), foldEnv, printer).fold(error => Left(error), t => {
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
        eval(value, env, printer).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case LoopExpr(condition : Expr, body : Expr) =>
        /* Note to self: Too much recursion error when looping recursively */
        var loopEnv : Map[String, Any] = env
        var lastResult : Any = Unit
        var lastError : Option[String] = None
        def getCondition = eval(condition, loopEnv, printer).fold(error => {lastError = Some(error); false}, v => {
          loopEnv = v._1
          v._2.asInstanceOf[Boolean]
        })
        while (lastError.isEmpty && getCondition) {
          eval(body, loopEnv, printer).fold(s => {lastError = Some(s); s}, x => {
            lastResult = x._2
            loopEnv = x._1
          })
        }
        lastError.map(Left(_)).getOrElse(Right(loopEnv.filter(t => env.contains(t._1)) -> lastResult))

      case x => Left(s"Unknown expression $x")
    }

  }

  def getValue[T : Manifest](expr : Expr, env : Env, printer : Printer) : Either[String, T] = {
    eval(expr, env, printer) match {
      case Right((_, t : T)) => Right(t)
      case fail => Left(s"Failed to read value from $expr, failed with: $fail")
    }
  }

}