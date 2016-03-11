package com.repocad.util.event

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

}