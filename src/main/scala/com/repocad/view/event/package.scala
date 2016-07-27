package com.repocad.view

import org.scalajs.dom

import scala.language.implicitConversions

/**
  * Events directly or indirectly arriving from the user interacting with the application.
  */
package object event {

  implicit def keyboardEvent2RichKeyboardEvent(keyboardEvent: dom.KeyboardEvent): RichKeyboardEvent =
    new RichKeyboardEvent(keyboardEvent)

}
