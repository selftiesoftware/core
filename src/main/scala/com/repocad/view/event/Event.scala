package com.repocad.view.event

import com.repocad.geom.Vector2D

/**
  * An event arriving from the user.
  */
trait Event

trait MouseEvent extends Event {
  def point: Vector2D
}

case class MouseDown(point: Vector2D) extends MouseEvent
case class MouseMove(point: Vector2D) extends MouseEvent
case class MouseLeave(point: Vector2D) extends MouseEvent
case class MouseUp(point: Vector2D) extends MouseEvent

trait KeyboardEvent extends Event {
  def key: String
  def modifierKeys: ModifierKeys
}

case class KeyDown(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent
case class KeyUp(key: String, modifierKeys: ModifierKeys) extends KeyboardEvent
