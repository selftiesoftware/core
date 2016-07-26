package com.repocad.view.event

import com.repocad.geom.Vector2D

/**
  * An event arriving from the user.
  */
trait Event

/**
  * An event arriving from the interaction of a mouse.
  */
trait MouseEvent extends Event {
  /**
    * The position of the mouse event relative to the view coordinates.
    *
    * @return A [[Vector2D]] denoting the x and y coordinates in a 2-d space.
    */
  def point: Vector2D
}

case class MouseDown(point: Vector2D) extends Event

case class MouseMove(point: Vector2D) extends Event

case class MouseLeave(point: Vector2D) extends Event

case class MouseScroll(point: Vector2D, delta: ScrollDistance) extends Event

case class MouseUp(point: Vector2D) extends Event

/**
  * An event arriving from the interaction of a keyboard.
  */
trait KeyboardEvent extends Event {

  /**
    * The string representation of the pressed key.
    *
    * @return
    */
  def key: String

  /**
    * Descriptions of which modifier keys are currently pressed.
    *
    * @return A [[ModifierKeys]] object.
    */
  def modifierKeys: ModifierKeys

}

case class KeyDown(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent

case class KeyUp(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent

/**
  * A scrolling distance described by a double value.
  *
  * @param value The value the scroll event scrolls.
  */
sealed case class ScrollDistance(value: Double)

case object ScrollDistance {
  def apply(value: Double) = if (value >= 0) ScrollUp(value) else ScrollDown(value)
}

sealed case class ScrollUp(value: Double) extends ScrollDistance(value)

sealed case class ScrollDown(value: Double) extends ScrollDistance(value)