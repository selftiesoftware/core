package com.repocad.view

import com.repocad.geom.{TransformationMatrix, Vector2D}
import com.repocad.view.event.{Event, _}
import org.scalajs.dom.MouseEvent
import org.scalajs.dom.raw.HTMLCanvasElement

import scala.scalajs.js.annotation.JSExport

/**
  * A canvas that can draw a drawing
  */
class CanvasView(canvas: HTMLCanvasElement) extends View {

  private val events: EndlessIterator[Event] = new EndlessIterator[Event]()

  canvas.onmousedown = (e: MouseEvent) => enqueueMouseEvent(e, MouseDown))
  canvas.onmousemove = (e: MouseEvent) => enqueueMouseEvent(e, MouseMove))
  canvas.onmouseleave = (e: MouseEvent) => enqueueMouseEvent(e, MouseLeave)
  canvas.onmouseup = (e: MouseEvent) => enqueueMouseEvent(e, MouseUp))

  canvas.onkeydown = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyboardEvent(e, KeyDown)
  canvas.onkeyup = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyboardEvent(e, KeyUp)
  canvas.onkeypress = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyboardEvent(e, KeyDown)

  private def enqueue(event: Event): Unit = events.enqueue(event)

  private def enqueueKeyboardEvent(e: org.scalajs.dom.KeyboardEvent, f: (String, ModifierKeys) => Event): Unit =
    f(e.key, ModifierKeys(e))

  private def enqueueMouseEvent(e: MouseEvent, f: Vector2D => Event): Unit = enqueue(f(Vector2D(e.clientX, e.clientY)))

  @JSExport
  def canvasCenter = Vector2D(canvas.width / 2, canvas.height / 2)

  def windowCenter = Vector2D(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top) + canvasCenter

  override protected def getState: (TransformationMatrix, Option[Event]) = {
    events.hasNext match {
      case true => (transformation, Some(events.next))
      case false => (transformation, None)
    }
  }

}
