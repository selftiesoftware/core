package com.repocad.web

import com.repocad.geom.{TransformationMatrix, Vector2D}
import com.repocad.renderer.View
import com.repocad.reposcript.model.{SeqModel, ShapeModel}
import com.repocad.web.util.event.{EndlessIterator, Event, MouseDown, MouseMove}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLCanvasElement

import scala.scalajs.js.annotation.JSExport

/**
  * A canvas that can draw a drawing
  */
class CanvasView(canvas: HTMLCanvasElement) extends View {

  override val renderer = new CanvasRenderer(canvas)

  override val events: EndlessIterator[Event] = new EndlessIterator[Event]()

  private var model: ShapeModel = SeqModel(Seq())
  private var transformation = TransformationMatrix()

  var mousePosition = Vector2D(0, 0)
  var mouseDown = false

  val mouseExit = (e: MouseEvent) => {
    mouseDown = false
  }

  protected def enqueue(event: Event): Unit = events.enqueue(event)

  @JSExport
  def canvasCenter = Vector2D(canvas.width / 2, canvas.height / 2)

  def windowCenter = Vector2D(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top) + canvasCenter

  canvas.onmousedown = (e: MouseEvent) => {
    mouseDown = true
    mousePosition = Vector2D(e.clientX, e.clientY)
    enqueue(MouseDown(Vector2D(e.clientY, e.clientY)))
  }

  canvas.onmousemove = (e: MouseEvent) => {
    val newV = Vector2D(e.clientX, e.clientY)
    if (mouseDown) {
      transformation = transformation.translate((newV - mousePosition).x, (newV - mousePosition).y)
      mousePosition = newV
    } else {
      enqueue(MouseMove(newV))
    }
  }
  canvas.onmouseleave = mouseExit
  canvas.onmouseup = mouseExit

  @JSExport
  def zoom(wheel: Double, e: MouseEvent): Unit = {
    val delta = if (wheel > 0) {
      1.1
    } else {
      0.9
    }

    zoom(delta, Vector2D(e.clientX, e.clientY))
  }

  def zoom(delta: Double): Unit = {
    transformation = transformation.scale(delta)
    renderer.render(model, transformation)
  }

  override def zoom(delta: Double, position: Vector2D): Unit = {
    transformation = transformation.translate(position.x, position.y).scale(delta)
    renderer.render(model, transformation)
  }

  /**
    * Sets the pan and zoom level to include the entire paper. Useful when after large import or panned out of view.
    */
  override def zoomExtends() {
    //    val t = -_transformation.translation + canvasCenter
    //    val pC = model.boundary.center
    //    transform(_.scale(1 / _transformation.scale))
    //    transform(_.translate(t.x, t.y))
    //    transform(_.scale(1.0 / scale.value))
    //    transform(_.translate(-pC.x, pC.y))
  }

  //  def toPngUrl: String = {
  //    val t = renderer.transformation
  //    printer.zoomExtends()
  //    printer.drawPaper()
  //    render()
  //    val r = canvas.toDataURL("image/png")
  //    printer.transform(_ => t)
  //    render()
  //    r
  //  }

}
