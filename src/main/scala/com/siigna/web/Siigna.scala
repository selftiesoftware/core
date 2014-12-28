package com.siigna.web

import com.siigna.web.evaluating.Evaluator
import com.siigna.web.lexing.{Token, LiveStream, Lexer}
import com.siigna.web.parsing.{UnitExpr, Expr, Parser}
import org.scalajs.dom._
import org.scalajs.dom.extensions.Ajax
import scala.scalajs.concurrent.JSExecutionContext.Implicits.runNow

import scala.scalajs.js
import scala.scalajs.js.annotation.JSExport
import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating siigna code
 * @param canvas The canvas on which to draw
 * @param input The input field containing the textual code
 * @param debug A debug field to be used for (error) messages
 */
@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement, input : HTMLTextAreaElement, debug : HTMLDivElement) {

  val view = new CanvasView(canvas)

  var mousePosition = Vector2D(0, 0)
  var mouseDown = false
  var lastAst : Expr = UnitExpr
  var activeRepl = true

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  @JSExport
  def zoom(level : Double, e : MouseEvent) = {
    view.zoom(level, e.clientX, e.clientY)
    eval(lastAst, view)
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
      view.translate((newPosition - mousePosition).x, (newPosition - mousePosition).y)
      mousePosition = newPosition
      eval(lastAst, view)
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def init() : Unit = {
    view.init()
    val f = Ajax.get("http://localhost:8080/get/readme.md")
    f.foreach(println)
  }

  @JSExport
  def eval(code : String) : Unit = {
    eval(parse(code), view)
  }

  def eval(ast : Either[String, Expr], printer : Printer): Unit = {
    ast.fold(error => displayError(s"Failure during parsing: $error"), success => eval(success, printer))
  }

  def eval(expr : Expr, printer : Printer) : Unit = {
    lastAst = expr
    view.clear()
    Evaluator.eval(expr, Map(), printer).fold(error => displayError(s"Failure during evaluation: $error"), _ => displaySuccess())
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
  def printPdf(name : String) : Unit = {
    val printer = new PdfPrinter()
    Evaluator.eval(lastAst, Map(), printer)
    printer.save(name)
  }

  @JSExport
  def toggleRepl(): Boolean = {
    activeRepl = !activeRepl
    activeRepl
  }

}