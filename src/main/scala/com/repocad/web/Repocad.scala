package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import com.repocad.web.html.Editor
import org.scalajs.dom._
import org.scalajs.dom.raw.{HTMLButtonElement, HTMLDivElement, HTMLInputElement, HTMLCanvasElement}

import scala.scalajs.js
import scala.scalajs.js.JSConverters.JSRichGenTraversableOnce
import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating repocad code
 * @param canvas The canvas on which to draw
 *
 *              TODO: Version numbers for AST!
 *              TODO: Import versioned compilers on request
 *              TODO: Use optimised JS
 */
@JSExport("Repocad")
class Repocad(canvas : HTMLCanvasElement, editorDiv : HTMLDivElement, title : HTMLInputElement,
              searchDrawing : HTMLButtonElement, newDrawing : HTMLButtonElement) {

  val view = new CanvasView(canvas)
  val editor = new Editor(editorDiv, view)

  var mousePosition = Vector2D(0, 0)
  var mouseDown = false

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
    run()
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

      run()
    }
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def init() : Unit = {
    run() //run the Evaluator to get drawing boundary (needed to draw the paper)
    view.init()

    val listener = (hash : String) => {
      if (!hash.isEmpty) {
        Drawing.get(hash).fold(editor.displayError, drawing => {
          title.value = drawing.name
          loadDrawing(drawing)
          editor.displaySuccess(s"Loaded drawing $hash")
        })
      }
    }

    val drawing = window.location.hash match {
      case name : String if name.size > 1 => Drawing.get(name.substring(1))
      case _ => Drawing.get("default")
    }
    drawing match {
      case Right(x) => {
        title.value = x.name
        editor.setDrawing(x)
      }
      case Left(error) => editor.displayError("Failed to load drawig: " + error)
    }
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
    editor.evaluate(view, useCache = false)
  }

  def loadDrawing(drawing : Drawing) : Unit = {
    editor.setDrawing(drawing)
    window.location.hash = drawing.name
    run()
  }

  @JSExport
  def getDrawings() : js.Array[String] = new JSRichGenTraversableOnce[String](Drawing.drawings).toJSArray

  @JSExport
  def run() : Unit = {
    view.clear() //redraw the canvas
    Evaluator.resetBoundingBox() //set the default paper scale
    Paper.scaleAndRotation()//adapt paper
    editor.evaluate(view)
  }

  @JSExport
  def save() : Unit = {
    editor.displaySuccess(editor.module().save().toString)
  }

  @JSExport
  def printPdf(name : String) : Unit = {
    val printer = new PdfPrinter()
    editor.evaluate(printer, useCache = true)
    printer.save(name)
  }

}