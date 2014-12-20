package com.siigna.web

import com.siigna.web.evaluating.Evaluator
import com.siigna.web.lexing.{Token, LiveStream, Lexer}
import com.siigna.web.parsing.{Expr, Parser}
import org.scalajs.dom._

import scala.scalajs.js.annotation.JSExport

@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement, input : HTMLTextAreaElement, debug : HTMLDivElement) {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
  val evaluator = new Evaluator(context)

  input.onkeyup = (e : Event) => {
    eval(parse(input.value).right.map(x => {
      clear()
      x
    }))
  }

  @JSExport
  def clear(): Unit = {
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, 10000, 10000)
  }

  @JSExport
  def eval(code : String) : Unit = {
    context.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2)

    eval(parse(code))
  }

  def eval(ast : Either[String, Expr]): Unit = {
    ast.fold(error => displayError("Failure during parsing: " + error), exprs =>
      evaluator.eval(exprs, Map()).fold(error => displayError("Failure during evaluation: " + error), _ => displaySuccess())
    )
  }

  def lex(text : String) : LiveStream[Token] = {
    val stream = LiveStream(text)
    val lexer = new Lexer()
    lexer.lex(stream)
    lexer.output
  }

  def parse(code : String): Either[String, Expr] = {
    Parser.parse(lex(code))
  }

  def displayError(error : String): Unit = {
    debug.innerHTML = error
  }

  def displaySuccess(): Unit = {
    debug.innerHTML = ""
  }


}