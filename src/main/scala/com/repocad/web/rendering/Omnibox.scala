package com.repocad.web.rendering

import com.repocad.web.{Paper, Drawing}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLInputElement

/**
 * The omnibox that is used for search and loading
 */
class Omnibox(inputField : HTMLInputElement, editor : Editor, canvas : Canvas) {

  val drawing = window.location.hash match {
    case name : String if name.size > 1 => Drawing.get(name.substring(1))
    case _ => Drawing.get("default")
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
    com.repocad.web.evaluating.Evaluator.resetBoundingBox //reset the paper
    window.location.hash = drawing.name
    inputField.value = drawing.name
    editor.setDrawing(drawing)
    canvas.render(editor.getAst)
    println("set paper")
    //Paper.scaleAndRotation()

  }

  def loadDrawing(name : String) : Unit = {
    if (!name.isEmpty) {
      Drawing.get(name).fold(println, drawing => {
        inputField.value = drawing.name
        loadDrawing(drawing)
      })
    }
  }
}
