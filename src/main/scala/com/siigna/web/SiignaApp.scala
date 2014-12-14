package com.siigna.web

import com.siigna.web.evaluating.Evaluator
import com.siigna.web.lexing.{LiveStream, Lexer}
import com.siigna.web.parsing.{UnitExpr, Parser}
import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

import scala.scalajs.js.JSApp
import scala.scalajs.js.annotation.JSExport

@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement, debug : HTMLCanvasElement) {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
  val evaluator = new Evaluator(context)

  @JSExport
  def clear() : Unit = {
    context.clearRect(0, 0, 10000, 10000)
  }

  @JSExport
  def parse(code : String) : Unit = {
    val stream = LiveStream(code)
    val lexer = new Lexer()
    lexer.lex(stream)

    val tokens = lexer.output

    Parser.parse(tokens).fold(error => displayError("Failure during parsing: " + error), exprs =>
      evaluator.eval(exprs, Map()).fold(error => displayError("Failure during evaluation: " + error), _ => displaySuccess())
    )

  }

  def displayError(error : String): Unit = {
    debug.innerHTML = error
  }

  def displaySuccess(): Unit = {
    debug.innerHTML = "";
  }


}