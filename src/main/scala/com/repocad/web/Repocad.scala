package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import com.repocad.web.lexing.{Lexer}
import com.repocad.web.parsing.{UnitExpr, Expr, Parser}
import org.scalajs.dom
import org.scalajs.dom._

import scala.scalajs.js
import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating repocad code
 * @param canvas The canvas on which to draw
 * @param input The input field containing the textual code
 * @param debug A debug field to be used for (error) messages
 */
@JSExport("Repocad")
class Repocad(canvas : HTMLCanvasElement, input : HTMLTextAreaElement, debug : HTMLDivElement) {

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

    //get the current zoom level
    def zoomFactor = {
      if (zoomLevel < 0) 1/zoomLevel.abs else if(zoomLevel == 0) 1 else zoomLevel
    }
      //calculate the paper center in canvas coordinates
        mouseClient = Vector2D(e.clientX,e.clientY)

    mouseCanvas = Vector2D(mouseClient.x - canvasCorner.x,-mouseClient.y + canvasCorner.y)

    //TODO: Papirets center i relation til canvas TL corner mangler.

    if (mouseDown) {

      val newV = Vector2D(e.clientX, e.clientY)
      val translation = Vector2D((newV - mousePosition).x, (newV - mousePosition).y)

      view.translate(translation.x,translation.y)

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
      val x = Drawing.get(hash)
        x.fold(displayError, drawing => {
        loadDrawing(drawing)
        displaySuccess(s"Loaded drawing $hash")
      })
    }
    // Call and set listener
    val d = loadDrawing(drawing)
    Drawing.setHashListener(listener)

  }

  def loadDrawing(drawing : Drawing) : Unit = {
    this.drawing = drawing
    Paper.scaleAndRotation()//adapt paper
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
          //println("Eval: " + x)
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
    view.clear()
    Evaluator.resetBoundingBox() //set the default paper scale
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