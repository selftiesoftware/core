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
    val listener = (hash : String) => {
      val x = Drawing.get(hash)
        x.fold(displayError, drawing => {
        loadDrawing(drawing)
        displaySuccess(s"Loaded drawing $hash")
      })
    }
    // Call and set listener
    loadDrawing(drawing)
    Drawing.setHashListener(listener)
  }

  def loadDrawing(drawing : Drawing) : Unit = {
    this.drawing = drawing
    input.value = drawing.content
    window.location.hash = drawing.name
    run()
  }

  @JSExport
  def run() : Unit = {
    Parser.parse(Lexer.lex(drawing.content))
          .fold(left => displayError("Error while reading code " + left),
            right => eval(right))
  }

  @JSExport
  def save() : Unit = {
    drawing.save() match {
      case Response(_, 4, _) => displaySuccess(s"Successfully stored drawing '${drawing.name}'")
      case x => displayError("Failure when saving drawing: " + x)
    }
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

  def displaySuccess(success : String = ""): Unit = {
    debug.innerHTML = success
  }

  @JSExport
  def printPdf(name : String) : Unit = {
    val printer = new PdfPrinter()
    Evaluator.eval(lastAst, Map(), printer)
    printer.save(name)
  }

}