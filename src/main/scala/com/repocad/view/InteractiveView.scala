package com.repocad.view

import com.repocad.geom.{TransformationMatrix, Vector2D}
import com.repocad.view.event.{Event, MouseDown, MouseMove, MouseUp}

object InteractiveView extends ViewFilter {

  private var mouseDown = false
  private var mousePosition = Vector2D(0, 0)

  override def apply(transformation: TransformationMatrix,
                     eventOption: Option[Event]): (TransformationMatrix, Option[Event]) = {
    eventOption match {
      case Some(MouseDown(point)) =>
        mouseDown = true
        mousePosition = point
        (transformation, eventOption)
      case Some(MouseMove(point)) =>
        mousePosition = point
        (transformation.translate(point.x, point.y), eventOption)
      case Some(MouseUp(point)) =>
        mouseDown = false
        mousePosition = point
        (transformation, eventOption)
      case Some(_) | None => (transformation, eventOption)
    }
  }

}
