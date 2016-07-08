package com.repocad.view

import com.repocad.geom.{TransformationMatrix, Vector2D}
import com.repocad.view.event.{Event, MouseDown, MouseMove, MouseUp}

object InteractiveView extends ViewFilter {

  private var mouseDown = false
  private var mousePosition = Vector2D(0, 0)

  override def apply(state: (TransformationMatrix, Option[Event])): (TransformationMatrix, Option[Event]) = {
    state._2 match {
      case Some(MouseDown(point)) =>
        mouseDown = true
        mousePosition = point
        state
      case Some(MouseMove(point)) =>
        mousePosition = point
        (state._1.translate(point.x, point.y), state._2)
      case Some(MouseUp(point)) =>
        mouseDown = false
        mousePosition = point
        state
      case None => state
    }
  }

}
