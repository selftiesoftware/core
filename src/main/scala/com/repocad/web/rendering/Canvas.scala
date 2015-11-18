package com.repocad.web.rendering

import com.repocad.reposcript.Printer
import com.repocad.reposcript.parsing._
import com.repocad.util.Vector2D
import com.repocad.web.{Reposcript, CanvasPrinter}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLCanvasElement

import scala.scalajs.js

/**
 * A canvas that can draw a drawing
 */
class Canvas(canvas : HTMLCanvasElement, editor : Editor, printer : CanvasPrinter) {

  var zoomLevel : Double = 1

  var mousePosition = Vector2D(0, 0)
  var mouseDown = false

  val mouseExit = (e : MouseEvent) => {
    mouseDown = false
  }

  def zoom(wheel: Double, e : MouseEvent) = {
    val delta = if (wheel > 0) {
      1.1
    } else {
      0.9
    }

    printer.zoom(delta, e.clientX, e.clientY)
    zoomLevel += 1 - delta //update the zoom level
    render(editor.getAst)
  }

  canvas.onmousedown = (e : MouseEvent) => {
    mouseDown = true
    mousePosition = Vector2D(e.clientX, e.clientY)

    //testing zoom extends
    //printer.zoomExtends()
    //render(editor.getAst)
  }

  canvas.onmousemove = (e : MouseEvent) => {
    if (mouseDown) {
      val newV = Vector2D(e.clientX, e.clientY)
      printer.translate((newV - mousePosition).x, (newV - mousePosition).y)
      mousePosition = newV
      render(editor.getAst)
    }
  }

  def render(ast : Expr) {
    render(ast, printer)
  }

  def render(ast : Expr, printer : Printer[_]): Unit = {
    printer.prepare() //redraw the canvas
    Reposcript.evaluate(ast, printer)
    printer.execute()
  }

  def toPngUrl : String = {
    printer.zoomExtends()
    render(editor.getAst)
    canvas.toDataURL("image/png")
  }

  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

}
