package com.siigna.web

import com.siigna.web.Lexer.Token
import org.scalajs.dom.CanvasRenderingContext2D
import scala.util.matching.Regex

trait Expr
case class SeqExpr(expr : Expr*) extends Expr
case class LineExpr(x1 : NumberExpr, y1 : NumberExpr, x2 : NumberExpr, y2 : NumberExpr) extends Expr
case class NumberExpr(x : Double) extends Expr

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

  val exprNumber = """([0-9]+)""".r

  def parse(code : String, context : CanvasRenderingContext2D) : Unit = {
    val tokens = Lexer(code, "")
    val exprs  = parse(tokens)
    exprs match {
      case Right(LineExpr(x1, y1, x2, y2)) => {
        context.beginPath()
        context.moveTo(x1.x, y1.x)
        context.lineTo(x2.x, y2.x)
        context.stroke()
        context.closePath()
      }
      case rest => {
        println(rest)
      }
    }
  }

  def parse(tokens : Seq[Token]) : Either[String, Expr] = {
    tokens.head match {
      case "//" => parse(tokens.dropWhile(!_.equals("\n")))
      case "line" =>
        parseNumberExprs(tokens.tail, 4).right.map(nrs => {
          LineExpr(nrs(0), nrs(1), nrs(2), nrs(3))
        })

      case exprNumber(value) =>
        Right(NumberExpr(value.toDouble))

      case "\n" | "" => parse(tokens.tail)

      case rest => Left(s"Unknown token '$rest'")
    }
  }

  def parseNumberExprs(tokens : Seq[Token], number : Int) : Either[String, Seq[NumberExpr]] = {
    tokens.head match {
      case exprNumber(value) => {
        if (number > 1) {
          parseNumberExprs(tokens.tail, number - 1).right.map(Seq(NumberExpr(value.toDouble)).++(_))
        } else {
          Right(Seq(NumberExpr(value.toDouble)))
        }
      }
      case failure => Left(s"Expected number, got $failure")
    }
  }

}
