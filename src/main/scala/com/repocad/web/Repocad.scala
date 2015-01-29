package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing.{Expr, Parser, UnitExpr}
import org.scalajs.dom._

import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating repocad code
 * @param canvas The canvas on which to draw
 * @param input The input field containing the textual code
 * @param debug A debug field to be used for (error) messages
 *
 *
 *              TODO: Version numbers for AST!
 *              TODO: Import versioned compilers on request
 *              TODO: Use optimised JS
 */
@JSExport("Repocad")
class Repocad(canvas : HTMLCanvasElement, input : HTMLTextAreaElement, debug : HTMLDivElement, title : HTMLInputElement,
              searchDrawing : HTMLButtonElement, newDrawing : HTMLButtonElement) {

  val view = new CanvasView(canvas)

  var drawing : Drawing = Drawing()
  var mousePosition = Vector2D(0, 0)
  var mouseDown = false
  var lastAst : Expr = UnitExpr
  var lastValue : String = ""

  var landscape = view.landscape
  var center : Vector2D = view.windowCenter

  var zoomLevel : Int = 0 // the current zoom-level

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  @JSExport
  def zoom(delta : Double, e : MouseEvent) = {
    view.zoom(delta, e.clientX, e.clientY)
    zoomLevel = zoomLevel + delta.toInt //update the zoom level

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


      val zoomFactor = zoomLevel.toDouble.abs
      val newZ1 = math.pow(zoomFactor,1.1)
      val newZ2 = math.pow(zoomFactor,0.5)

      val newV = Vector2D(e.clientX, e.clientY)
      if(zoomLevel < 0) { //zooming out
        view.translate((newV - mousePosition).x * newZ1, (newV - mousePosition).y * newZ1)
      } else if(zoomLevel > 0){//zooming in
        view.translate((newV - mousePosition).x / newZ2, (newV - mousePosition).y / newZ2)
      } else view.translate((newV - mousePosition).x, (newV - mousePosition).y)
      mousePosition = newV
      eval(lastAst)
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def init() : Unit = {
    run()//run the Evaluator to get drawing boundary (needed to draw the paper)
    eval(lastAst)
    view.init()

    val listener = (hash : String) => {
      if (!hash.isEmpty) {
        Drawing.get(hash).fold(displayError, drawing => {
          title.value = drawing.name
          loadDrawing(drawing)
          displaySuccess(s"Loaded drawing $hash")
        })
      }
    }
    // Call and set listener
    val d = loadDrawing(drawing)
    title.value = drawing.name

    Drawing.setHashListener(listener)

    val loadListener =
    title.onkeydown = (e : KeyboardEvent) => {
      if (e.keyCode == 13) {
        listener(title.value)
        window.location.hash = title.value
      }
    }

    searchDrawing.onclick = (e : MouseEvent) => {
      listener(title.value)
      window.location.hash = title.value
    }

    newDrawing.onclick = (e : MouseEvent) => {
      val title = scala.scalajs.js.Dynamic.global.prompt("Name the new drawing").toString
      if (title != null && !title.isEmpty) {
        listener(title)
        window.location.hash = title
      }
    }
  }

  def loadDrawing(drawing : Drawing) : Unit = {
    Evaluator.resetBoundingBox()//reset paper
    Paper.scaleAndRotation()//adapt paper
    view.drawPaper() //draw paper
    this.drawing = drawing
    input.value = drawing.content
    window.location.hash = drawing.name
    run()
  }

  @JSExport
  def run() : Unit = {
    val tokens = Lexer.lex(drawing.content)
    Parser.parse(tokens)
      .fold(left => displayError("Error while compiling code: " + left),
        right => {
          //println("AST: " + right)
          val x = eval(right)
          x
        })
    //update the paper scale and position
    Paper.scaleAndRotation()//
  }

  @JSExport
  def save() : Unit = {
    displaySuccess(drawing.save().toString)
  }

  def eval(expr : Expr) : Unit = {
    lastAst = expr
    view.clear() //redraw the canvas
    Evaluator.resetBoundingBox() //set the default paper scale
    Evaluator.eval(expr, view)
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
    Evaluator.eval(lastAst, printer)
    printer.save(name)
  }

}