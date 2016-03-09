package com.repocad.web.rendering

import com.repocad.web.{CanvasView, CodeEditor, Drawing}
import org.scalajs.dom._
import org.scalajs.dom.raw.{HTMLButtonElement, HTMLInputElement}

import scala.scalajs.js.Dynamic
import scala.scalajs.js.annotation.JSExport

/**
  * The omnibox that is used for search and loading
  */
@JSExport("Omnibox")
class Omnibox(inputField: HTMLInputElement, editor: CodeEditor, canvas: CanvasView,
              searchDrawing: HTMLButtonElement, newDrawing: HTMLButtonElement) {

  val defaultDrawing = "default"

  private val drawing = window.location.hash match {
    case name: String if name.nonEmpty => Drawing.get(name.substring(1))
    case _ => Drawing.get(defaultDrawing)
  }

  drawing match {
    case Right(x) => loadDrawing(x)
    case Left(error) => println("Failed to load drawing: " + error)
  }

  inputField.onkeyup = (e: KeyboardEvent) => {
    if (e.keyCode == 13) {
      loadDrawing(inputField.value)
    }
  }

  searchDrawing.onclick = (e: MouseEvent) => {
    loadDrawing(inputField.value)
  }

  newDrawing.onclick = (e: MouseEvent) => {
    val name = Dynamic.global.prompt("Please write the name of the new drawing")
    if (name != null) {
      loadDrawing(name.toString)
    }
  }

  Drawing.setHashListener(loadDrawing)

  def loadDrawing(drawing: Drawing): Unit = {
    window.location.hash = drawing.name
    if (drawing.name != defaultDrawing) {
      inputField.value = drawing.name
    }
    editor.setDrawing(drawing)
  }

  def loadDrawing(name: String): Unit = {
    if (!name.isEmpty) {
      Drawing.get(name).fold(println, drawing => {
        loadDrawing(drawing)
      })
    }
  }
}
