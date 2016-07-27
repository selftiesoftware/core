package com.repocad.view.event

import com.repocad.web
import org.scalajs.dom
import org.scalajs.dom.ext.{KeyValue, KeyCode}

/**
  * An enrichment of a ScalaJs Keyboard event to make it easier to extract the key.
  */
class RichKeyboardEvent(nativeEvent: dom.KeyboardEvent) {

  def standardKey: String = nativeEvent.keyCode match {
    case KeyCode.Alt => KeyValue.Alt
    case KeyCode.Backspace => KeyValue.Backspace
    case KeyCode.Ctrl => KeyValue.Control
    case KeyCode.Delete => KeyValue.Delete
    case KeyCode.Down => KeyValue.ArrowDown
    case KeyCode.End => KeyValue.End
    case KeyCode.Enter => KeyValue.Enter
    case KeyCode.Home => KeyValue.Home
    case KeyCode.Left => KeyValue.ArrowLeft
    case KeyCode.Right => KeyValue.ArrowRight
    case KeyCode.Shift => KeyValue.Shift
    case KeyCode.Space => KeyValue.Spacebar
    case KeyCode.Up => KeyValue.ArrowUp
    case _ => KeyValue.Unidentified
  }

}
