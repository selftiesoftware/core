package com.repocad.web

import com.repocad.util.{BoundlessPaper, Vector2D}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLCanvasElement

import scala.scalajs.js.annotation.JSExport

/**
  * A canvas that can draw a drawing
  */
@JSExport("CanvasView")
class CanvasView(canvas: HTMLCanvasElement, editor: Editor) extends View {

  val printer = new CanvasPrinter(canvas)

  var zoomLevel: Double = 1

  var mousePosition = Vector2D(0, 0)
  var mouseDown = false

  val mouseExit = (e: MouseEvent) => {
    mouseDown = false
  }

  def canvasCenter = Vector2D(canvas.width / 2, canvas.height / 2)

  def windowCenter = Vector2D(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top) + canvasCenter

  canvas.onmousedown = (e: MouseEvent) => {
    mouseDown = true
    mousePosition = Vector2D(e.clientX, e.clientY)
    render()
  }

  canvas.onmousemove = (e: MouseEvent) => {
    if (mouseDown) {
      val newV = Vector2D(e.clientX, e.clientY)
      printer.translate((newV - mousePosition).x, (newV - mousePosition).y)
      mousePosition = newV
      render()
    }
  }
  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def disablePaper(): Unit = {
    printer.paper = BoundlessPaper
  }

  def paper = printer.paper

  @JSExport
  def zoom(wheel: Double, e: MouseEvent): Unit = {
    val delta = if (wheel > 0) {
      1.1
    } else {
      0.9
    }

    zoom(delta, Vector2D(e.clientX, e.clientY))
  }

  override def zoom(delta: Double, position: Vector2D): Unit = {
    printer.zoom(delta, position - windowCenter)
    zoomLevel += 1 - delta //update the zoom level
    render()
  }

  override def zoomExtends(): Unit = {
    printer.zoomExtends()
  }

  private def render(): Unit = {
    editor.ast.get.right.foreach(render)
  }

  def toPngUrl: String = {
    val t = printer.transformation
    printer.zoomExtends()
    printer.drawPaper()
    editor.ast.get.right.foreach(render)
    val r = canvas.toDataURL("image/png")
    printer.transform(_ => t)
    render()
    r
  }

}
