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



case class MouseDown(point: Vector2D) extends MouseEvent
case class MouseMove(point: Vector2D) extends MouseEvent
case class MouseLeave(point: Vector2D) extends MouseEvent
case class MouseUp(point: Vector2D) extends MouseEvent
case class MouseScroll(point: Vector2D, delta: ScrollDistance) extends MouseEvent

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

/**
  * Triggered when a key is pressed down on a keyboard.
  * Examples: U, C, W, i, e, n, e, r, ' ', Å, ó, 'Control', 'Shift' etc.
  *
  * @param key          The key that was triggered as represented in [[org.scalajs.dom.ext.KeyValue]].
  * @param modifierKeys The modifier keys active when the key was pressed.
  * @see [[org.scalajs.dom.ext.KeyValue]]
  */
case class KeyDown(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent

/**
  * Triggered when a key is no longer pressed down on a keyboard.
  * Examples: U, C, W, i, e, n, e, r, ' ', Å, ó, 'Control', 'Shift' etc.
  *
  * @param key          The key that is no longer pressed down.
  * @param modifierKeys The modifier keys active when the key left the 'pressed' state.
  */
case class KeyUp(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent

/**
  * A scrolling distance described by a double value.
  *
  * @param value The value the scroll event scrolls.
  */
sealed abstract class ScrollDistance(value: Double)

case object ScrollDistance {
  def apply(value: Double) = if (value >= 0) ScrollUp(value) else ScrollDown(value)
}

sealed case class ScrollUp(value: Double) extends ScrollDistance(value)

sealed case class ScrollDown(value: Double) extends ScrollDistance(value)
