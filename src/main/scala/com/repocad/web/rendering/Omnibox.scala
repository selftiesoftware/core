package com.repocad.web.rendering

import com.repocad.web.Drawing
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLInputElement

/**
 * The omnibox that is used for search and loading
 */
class Omnibox(inputField : HTMLInputElement, editor : Editor, canvas : Canvas) {

  val defaultDrawing = "default"

  private val drawing = window.location.hash match {
    case name : String if name.size > 1 => Drawing.get(name.substring(1))
    case _ => Drawing.get(defaultDrawing)
  }

  drawing match {
    case Right(x) => loadDrawing(x)
    case Left(error) => println("Failed to load drawing: " + error)
  }

  inputField.onkeyup = (e : KeyboardEvent) => {
    if (e.keyCode == 13) {
      loadDrawing(inputField.value)
    }
  }

  Drawing.setHashListener(loadDrawing)

  def loadDrawing(drawing : Drawing) : Unit = {
    window.location.hash = drawing.name
    if (drawing.name != defaultDrawing) {
      inputField.value = drawing.name
    }
    editor.setDrawing(drawing)
    editor.updateView()
  }

  def loadDrawing(name : String) : Unit = {
    if (!name.isEmpty) {
      Drawing.get(name).fold(println, drawing => {
        loadDrawing(drawing)
      })
    }
  }
}
