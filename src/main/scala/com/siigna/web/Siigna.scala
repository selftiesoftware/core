package com.siigna.web

import com.siigna.web.evaluating.Evaluator
import com.siigna.web.lexing.{Lexer}
import com.siigna.web.parsing.{UnitExpr, Expr, Parser}
import org.scalajs.dom
import org.scalajs.dom._

import scala.scalajs.js
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

  var drawing : Drawing = Drawing()
  var mousePosition = Vector2D(0, 0)
  var mouseDown = false
  var lastAst : Expr = UnitExpr
  var lastValue : String = ""

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  @JSExport
  def zoom(level : Double, e : MouseEvent) = {
    view.zoom(level, e.clientX, e.clientY)
    eval(lastAst)
  }

  input.onkeyup = (e : Event) => {
    if (drawing.content != input.value) {
      drawing = drawing.copy(content = input.value)
      run()
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
      eval(lastAst)
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def init() : Unit = {
    view.init()
    input.value = drawing.content
    Drawing.setHashListener(hash => {
      Drawing.get(hash).fold(displayError, drawing => {
        loadDrawing(drawing)
      })
    })
    run()
  }

  def loadDrawing(drawing : Drawing) : Unit = {
    this.drawing = drawing
    input.value = drawing.content
    run()
  }

  @JSExport
  def run() : Unit = {
    val ast = Parser.parse(Lexer.lex(drawing.content))
      println(ast)
          ast.fold(left => displayError("Error while reading code " + left),
            right => eval(right))
  }

  def eval(expr : Expr) : Unit = {
    lastAst = expr
    view.clear()
    Evaluator.eval(expr, Map(), view)
      .fold(
        error => displayError(s"Failure during evaluation: $error"),
        success => {
          displaySuccess()
        })
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

}