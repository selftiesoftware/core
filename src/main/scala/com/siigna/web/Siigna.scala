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
  var mouseDown = false
  var lastAst : Expr = UnitExpr

  var activeRepl = true

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  context.translate(canvas.width / 2, canvas.height / 2)

  def center = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
                        (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  @JSExport
  def zoom(level : Double, e : MouseEvent) = {
    val delta = 1 + (level * 0.05)
    val mousePoint = Vector2D(e.clientX - center.x, e.clientY - center.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(delta, delta)
    context.translate(-mousePoint.x, -mousePoint.y)
    eval(lastAst)
  }

  input.onkeyup = (e : Event) => {
    if (activeRepl) {
      eval(input.value)
    }
  }

  canvas.onmousedown = (e : MouseEvent) => {
    mouseDown = true
    mousePosition = Vector2D(e.clientX, e.clientY)
  }

  canvas.onmousemove = (e : MouseEvent) => {
    if (mouseDown) {
      val newPosition = Vector2D(e.clientX, e.clientY)
      context.translate((newPosition - mousePosition).x, (newPosition - mousePosition).y)
      mousePosition = newPosition
      clear()
      eval(lastAst)
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def clear(): Unit = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()
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
    clear()
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

  @JSExport
  def toggleRepl(): Unit = {
    activeRepl = !activeRepl
  }

}