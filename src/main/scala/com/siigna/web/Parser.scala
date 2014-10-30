package com.siigna.web

import com.siigna.web.lexing._
import org.scalajs.dom.CanvasRenderingContext2D

trait Expr

case object UnitExpr extends Expr

case class SeqExpr(expr: Expr*) extends Expr
case class LineExpr(e1: Expr, e2: Expr, e3: Expr, e4: Expr) extends Expr
case class ConstantExpr[A](value: A) extends Expr

trait ValExpr[A] extends Expr {
  val name: String
  val value: A
}

case class DoubleExpr(name: String, value: Double) extends ValExpr[Double]
case class IntExpr(name: String, value: Int) extends ValExpr[Int]
case class RefExpr(name: String) extends Expr

/**
 * Parses code into drawing commands
 */
object Parser {

  val exprAssignment = """([\p{L}]+) ?= ?([0-9]+)""".r
  val exprNumber = """([0-9]+)""".r
  val exprRHS = """([\p{L}+])""".r

  def parse(tokens: LiveStream[Token]): Either[String, Expr] = {
    tokens match {
      case SymbolToken("line") :~: IntToken(x1) :~: IntToken(y1) :~: IntToken(x2) :~: IntToken(y2) :~: tail =>
        parse(tail).right.map(expr => SeqExpr(LineExpr(ConstantExpr(x1), ConstantExpr(y1), ConstantExpr(x2), ConstantExpr(y2)), expr))

      case SymbolToken("line") :~: tail =>
        parse(tail).right.flatMap(x1 =>
          parse(tail.tail).right.flatMap(y1 =>
            parse(tail.tail.tail).right.flatMap(x2 =>
              parse(tail.tail.tail.tail).right.flatMap(y2 => {
                Right(LineExpr(x1, y1, x2, y2))
              })
            )
          )
        )

      case SymbolToken("val") :~: SymbolToken(name) :~: SymbolToken("=") :~: IntToken(value) :~: tail =>
        parse(tail).right.map(expr => SeqExpr(IntExpr(name, value), expr))

      case SymbolToken(name) :~: tail => Right(RefExpr(name))

      case IntToken(value : Int) :~: tail => Right(ConstantExpr(value))

      case LiveNil() :~: tail => Right(UnitExpr)

      case xs => {
        println(xs)
        Left(s"Unrecognised token pattern $xs")
      }
    }
  }

}

class Evaluator(context: CanvasRenderingContext2D) {

  def evaluate[T: Manifest](exps: Iterator[Expr], env: Map[String, Any], success: T => Unit, error: String => Unit): Unit = {
    if (exps.hasNext) {
      exps.next() match {
        case LineExpr(e1, e2, e3, e4) =>
          evaluate[Int](Iterator.single(e1), env, x1 => {
            evaluate[Int](Iterator.single(e2), env, y1 => {
              evaluate[Int](Iterator.single(e3), env, x2 => {
                evaluate[Int](Iterator.single(e4), env, y2 => {
                  context.beginPath()
                  context.moveTo(x1.toInt, y1.toInt)
                  context.lineTo(x2, y2)
                  context.stroke()
                  context.closePath()
                }, error)
              }, error)
            }, error)
          }, error)
          evaluate(exps, env, success, error)

        case ConstantExpr(value) if value.isInstanceOf[T] =>
          success(value.asInstanceOf[T])

        case IntExpr(name, value) =>
          evaluate(exps, env + (name -> value), success, error)

        case RefExpr(name) => env(name) match {
          case x: T => success(x)
          case x => error(s"Found $x expected " + manifest[T].runtimeClass.getSimpleName)
        }

        case seq: SeqExpr =>
          evaluate(exps.++(seq.expr), env, success, error)

        case UnitExpr => evaluate(exps, env, success, error)

        case x => println("Unknown expression " + x)
      }
    }
  }

}