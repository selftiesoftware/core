package com.siigna.web

import com.siigna.web.Lexer.Token
import org.scalajs.dom.CanvasRenderingContext2D

trait Expr
case class SeqExpr(expr : Expr*) extends Expr
case class LineExpr(x1 : DoubleExpr, y1 : DoubleExpr, x2 : DoubleExpr, y2 : DoubleExpr) extends Expr

trait ValExpr[A] extends Expr { val x : A }
case class DoubleExpr(x : Double) extends ValExpr[Double]
case class IntExpr(x : Int) extends ValExpr[Int]

object Lexer {

  type Token = String

  def apply(input : String, acc : String) : Seq[Token] = {
    if (!input.isEmpty) {
      val c   = input.head
      if (splitters.contains(c)) {
        Seq(acc, c.toString) ++ apply(input.tail, "")
      } else if (delimiters.contains(c)) {
        Seq(acc) ++ apply(input.tail, "")
      } else {
        apply(input.tail, acc + c)
      }
    } else if (!acc.isEmpty) {
      Seq(acc)
    } else {
      Seq()
    }
  }

  val delimiters = Seq(' ', '(', ')', '{', '}')

  val splitters = Seq('\n')

}

/**
 * Parses code into drawing commands
 */
object Parser {

  val exprAssignment = """(\p{L}+) ?= ?([0-9]+)""".r
  val exprNumber = """([0-9]+)""".r

  def parse[A : Manifest](tokens : Seq[Token]) : Either[String, Seq[Expr]] = {
    tokens.head match {
      case "//" => parse(tokens.dropWhile(!_.equals("\n")))
      case "line" => {
        parseNumberExprs(tokens.tail, 4).right.map(nrs => {
          Seq(LineExpr(nrs(0), nrs(1), nrs(2), nrs(3)))
        })
      }

      case exprNumber(value) => Right(Seq(DoubleExpr(value.toDouble)))

      case "\n" | "" => parse(tokens.tail)

      case rest => Left(s"Unknown token '$rest'")
    }
  }

  def parseNumberExprs(tokens : Seq[Token], number : Int) : Either[String, Seq[DoubleExpr]] = {
    tokens.head match {
      case exprNumber(value) => {
        if (number > 1) {
          parseNumberExprs(tokens.tail, number - 1).right.map(Seq(DoubleExpr(value.toDouble)).++(_))
        } else {
          Right(Seq(DoubleExpr(value.toDouble)))
        }
      }
      case failure => Left(s"Expected number, got $failure")
    }
  }

}

class Evaluator(context : CanvasRenderingContext2D) {

  def evaluate(expressions: Seq[Expr], success : Seq[Expr] => Unit, error : Seq[Expr] => Unit) : Unit = {
    expressions.head match {
      case LineExpr(x1, y1, x2, y2) => {
        context.beginPath()
        context.moveTo(x1.x, y1.x)
        context.lineTo(x2.x, y2.x)
        context.stroke()
        context.closePath()
      }
    }
  }

}