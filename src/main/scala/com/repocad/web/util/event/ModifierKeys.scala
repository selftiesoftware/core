package com.repocad.web.util.event

import org.scalajs.dom.ModifierKeyEvent

import scala.scalajs.js

/**
  * ModifierKeys used to match further information in a given event.
  * Arguments are listed as follows: Shift - Control - Alt
  */
case class ModifierKeys(shift: Boolean, ctrl: Boolean, alt: Boolean)

/**
  * Companion object for [[ModifierKeys]].
  */
object ModifierKeys {

  /**
    * An instance of [[ModifierKeys]] where Shift is pressed.
    */
  val Shift = ModifierKeys(true, false, false)

  /**
    * An instance of [[ModifierKeys]] where Control is pressed.
    */
  val Control = ModifierKeys(false, true, false)

  /**
    * An instance of [[ModifierKeys]] where Alt is pressed.
    */
  val Alt = ModifierKeys(false, false, true)

  /**
    * Creates a modifier keys domain object informing which modifiers were active when the given event was fired.
    *
    * @param e The event containing the information about the modifiers.
    * @return A [[ModifierKeys]] instance.
    */
  def apply(e: ModifierKeyEvent): ModifierKeys =
    new ModifierKeys(e.shiftKey, e.ctrlKey, e.altKey)

  def apply(e: js.Dynamic): ModifierKeys = {
    try {
      new ModifierKeys(e.shiftKey.asInstanceOf[Boolean], e.ctrlKey.asInstanceOf[Boolean], e.altKey.asInstanceOf[Boolean])
    } catch {
      case e: Exception => empty
    }
  }

  val empty = ModifierKeys(false, false, false)

}