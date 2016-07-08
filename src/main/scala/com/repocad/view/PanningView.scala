package com.repocad.view

import com.repocad.geom.{TransformationMatrix, Vector2D}
import com.repocad.view.event._

case class PanningView(private val view: View, private val interactiveState: InteractiveState)
  extends ViewFilter(view) {

  def state: (ViewFilter, Option[Event]) = {
    val newState = view.state
    newState._2 match {
      case Some(MouseDown(point)) =>
        val newInteractiveState = interactiveState.copy(mousePosition = point, mouseDown = true)
        (PanningView(newState._1, newInteractiveState), None)

      case Some(MouseMove(point)) if interactiveState.mouseDown =>
        (PanningView(newState._1, interactiveState.move(point)), None)

      case Some(MouseMove(point)) if !interactiveState.mouseDown =>
        (PanningView(newState._1, interactiveState), newState._2)

      case Some(MouseUp(point)) =>
        (PanningView(newState._1, InteractiveState(TransformationMatrix(), point, mouseDown = false)), newState._2)

      case Some(MouseLeave(point)) =>
        (PanningView(newState._1, InteractiveState(TransformationMatrix(), point, mouseDown = false)), newState._2)

      case e: Option[Event] => (PanningView(newState._1, interactiveState), e)
    }
  }

  def transformation: TransformationMatrix = interactiveState.transformation

}

sealed case class InteractiveState(transformation: TransformationMatrix, mousePosition: Vector2D, mouseDown: Boolean) {

  def move(point: Vector2D): InteractiveState = {
    val delta = point - mousePosition
    copy(transformation.translate(delta.x, delta.y), mousePosition = point)
  }

}
