package com.siigna.web

import com.siigna.web.lexing.Token
import org.scalajs.dom.CanvasRenderingContext2D

trait Expr
case object UnitExpr extends Expr

case class SeqExpr(expr : Expr*) extends Expr
case class LineExpr(e1 : Expr, e2 : Expr, e3 : Expr, e4 : Expr) extends Expr

trait ValExpr[A] extends Expr { val name : String; val value : A }
case class DoubleExpr(name : String, value : Double) extends ValExpr[Double]
case class IntExpr(name : String, value : Int) extends ValExpr[Int]

case class RefExpr(name : String) extends Expr



/**
 * Parses code into drawing commands
 */
object Parser {

  val exprAssignment = """([\p{L}]+) ?= ?([0-9]+)""".r
  val exprNumber = """([0-9]+)""".r
  val exprRHS = """([\p{L}+])""".r

  def parse(tokens : LiveStream[Token]) : Either[String, Seq[Expr]] = {

  }

  def parseRecursive[A : Manifest](tokens : Iterator[String]) : Either[String, Expr] = {
    if (tokens.hasNext) {
      tokens.next() match {
        case "//" => {
          while (tokens.next() != "\n") {}
          parseRecursive(tokens)
        }
        case "line" =>
          val x1 = parseRecursive(tokens)
          val y1 = parseRecursive(tokens)
          val x2 = parseRecursive(tokens)
          val y2 = parseRecursive(tokens)
          (x1, y1, x2, y2) match {
            case (Right(e1), Right(e2), Right(e3), Right(e4)) => Right(LineExpr(e1, e2, e3, e4))
            case e => Left("Failed to parse a line, expected four coordinates but found " + e)
          }

        case "val" =>
          val name = tokens.next
          tokens.next() match {
            case "=" => Right(IntExpr(name, tokens.next().toInt))
            case err => Left(s"Missing assignment '=' in value definition, found $err")
          }

        case exprNumber(value) => Right(IntExpr("x", value.toInt))

        case exprRHS(name) => Right(RefExpr(name))

        case "\n" | "" => parseRecursive(tokens)

        case rest => Left(s"Unknown token '$rest'")
      }
    } else {
      Right(UnitExpr)
    }
  }

}

class Evaluator(context : CanvasRenderingContext2D) {

  def evaluate[T : Manifest](exp: Expr, env : Map[String, Any], success : T => Unit, error : String => Unit) : Unit = {
    exp match {
      case LineExpr(e1, e2, e3, e4) => {
        evaluate[Int](e1, env, x1 => {
          evaluate[Int](e2, env, y1 => {
            evaluate[Int](e3, env, x2 => {
              evaluate[Int](e4, env, y2 => {
                context.beginPath()
                context.moveTo(x1.toInt, y1.toInt)
                context.lineTo(x2, y2)
                context.stroke()
                context.closePath()
              }, error)
            }, error)
          }, error)
        }, error)
      }
      case IntExpr(name, value) if value.isInstanceOf[T] => {
          success(value.asInstanceOf[T])
      }
      case IntExpr(name, value) => {
        error("Expected type " + manifest[T].runtimeClass.getSimpleName + " found " + value)
      }
      case RefExpr(name) => env(name) match {
        case x : T => success(x)
        case x => error(s"Found $x expected " + manifest[T].runtimeClass.getSimpleName)
      }
      case UnitExpr =>
    }
  }

}