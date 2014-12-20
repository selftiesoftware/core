package com.siigna.web

import com.siigna.web.evaluating.Evaluator
import com.siigna.web.lexing.{Token, LiveStream, Lexer}
import com.siigna.web.parsing.{UnitExpr, Expr, Parser}
import org.scalajs.dom._

import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating siigna code
 * @param canvas The canvas on which to draw
 * @param input The input field containing the textual code
 * @param debug A debug field to be used for (error) messages
 */
@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement, input : HTMLTextAreaElement, debug : HTMLDivElement) {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
  val evaluator = new Evaluator(context)
  var mousePosition = Vector2D(0, 0)
  var pan = Vector2D(0, 0)
  var mouseDown = false
  var lastAst : Expr = UnitExpr

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  input.onkeyup = (e : Event) => {
    eval(parse(input.value).right.map(x => {
      clear()
      x
    }))
  }

  canvas.onmousedown = (e : MouseEvent) => {
    mouseDown = true
    mousePosition = Vector2D(e.clientX, e.clientY)
  }

  canvas.onmousemove = (e : MouseEvent) => {
    if (mouseDown) {
      val newPosition = Vector2D(e.clientX, e.clientY)
      pan += newPosition - mousePosition
      mousePosition = newPosition
      clear()
      eval(lastAst)
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def clear(): Unit = {
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, 10000, 10000)
  }

  @JSExport
  def eval(code : String) : Unit = {
    eval(parse(code))
  }

  def eval(ast : Either[String, Expr]): Unit = {
    ast.fold(error => displayError("Failure during parsing: " + error), eval)
  }

  def eval(expr : Expr) : Unit = {
    lastAst = expr
    context.setTransform(1, 0, 0, 1, pan.x + (canvas.width / 2), pan.y + (canvas.height / 2))
    evaluator.eval(expr, Map()).fold(error => displayError("Failure during evaluation: " + error), _ => displaySuccess())
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