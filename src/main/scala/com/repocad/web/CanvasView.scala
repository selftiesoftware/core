package com.repocad.web

import com.repocad.geom.Vector2D
import com.repocad.view.View
import com.repocad.view.event._
import com.repocad.web
import org.scalajs.dom.ext.KeyValue
import org.scalajs.dom.raw.{HTMLCanvasElement, WheelEvent}
import org.scalajs.dom.{KeyboardEvent, MouseEvent}

import scala.scalajs.js
import scala.scalajs.js.annotation.JSExport

class CanvasView(canvas: HTMLCanvasElement) extends View {

  private val events: EndlessIterator[Event] = new EndlessIterator[Event]()

  canvas.onmousedown = (e: MouseEvent) => enqueueMouseEvent(e, MouseDown)
  canvas.onmousemove = (e: MouseEvent) => enqueueMouseEvent(e, MouseMove)
  canvas.onmouseleave = (e: MouseEvent) => enqueueMouseEvent(e, MouseLeave)
  canvas.onmouseup = (e: MouseEvent) => enqueueMouseEvent(e, MouseUp)
  canvas.onmousewheel = (e: WheelEvent) => enqueueMouseEvent(e, MouseScroll(_, ScrollDistance(e.deltaMode)))

  canvas.onkeydown = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyDown(e)
  canvas.onkeyup = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyUp(e)
  canvas.onkeypress = (e: org.scalajs.dom.KeyboardEvent) => enqueueKeyPress(e)

  private def enqueue(event: Event): Unit = events.enqueue(event)

  private def enqueueMouseEvent(e: MouseEvent, f: Vector2D => Event): Unit = enqueue(f(Vector2D(e.clientX, e.clientY)))

  @JSExport
  def canvasCenter = Vector2D(canvas.width / 2, canvas.height / 2)

  def windowCenter = Vector2D(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top) + canvasCenter

  def state: (View, Option[Event]) = {
    (this, events.next)
  }

  /**
    * Parses and enqueues key down events.
    *
    * @param event The event to react upon.
    */
  protected def enqueueKeyDown(event: KeyboardEvent): Unit = {
    val key = event.standardKey
    if (key == KeyValue.Unidentified && web.util.isAndroid) {
      // Android does not support key press events -_-
      // ... Which I guess is fine since it's becoming the standard
      enqueueKeyPress(event)
    } else {
      enqueue(KeyDown(event.standardKey, ModifierKeys(event)))
    }
  }

  /**
    * Parses and enqueues key up events.
    *
    * @param event The event to enqueue as a key up event.
    */
  protected def enqueueKeyUp(event: KeyboardEvent): Unit = {
    enqueue(KeyUp(event.standardKey, ModifierKeys(event)))
  }

  /**
    * Parses and enqueues key press events.
    *
    * @param scalaJsEvent The actual event being processed. This needs to be a native type because JavaScript is a messed up,
    *                     inconsistent and horrible language.
    */
  protected def enqueueKeyPress(scalaJsEvent: KeyboardEvent): Unit = {
    val event = scalaJsEvent.asInstanceOf[js.Dynamic]
    // Thanks to http://unixpapa.com/js/key.html
    val string = if (js.isUndefined(event.which)) {
      js.Dynamic.global.String.fromCharCode(event.keyCode); // old IE
    } else if (event.which.asInstanceOf[Double] != 0 && event.charCode.asInstanceOf[Int] != 0) {
      js.Dynamic.global.String.fromCharCode(event.which); // All others
    } else {
      // special key -- handled in keydown
    }

    if (!js.isUndefined(string)) {
      val modifiers = ModifierKeys(scalaJsEvent)
      val char = string.asInstanceOf[String]
      enqueue(KeyDown(char, modifiers))
    }
  }

}
