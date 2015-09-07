package com.repocad.web

import com.repocad.web.rendering.{Canvas, Editor, Omnibox}
import org.scalajs.dom.MouseEvent
import org.scalajs.dom.raw.{HTMLButtonElement, HTMLCanvasElement, HTMLDivElement, HTMLInputElement}

import scala.scalajs.js
import scala.scalajs.js.JSConverters.JSRichGenTraversableOnce
import scala.scalajs.js.annotation.JSExport

/**
 * The entry point for compiling and evaluating repocad code
 *
 *              TODO: Version numbers for AST!
 *              TODO: Import versioned compilers on request
 *              TODO: Use optimised JS
 */
@JSExport("Repocad")
class Repocad(canvasElement : HTMLCanvasElement, editorDiv : HTMLDivElement, title : HTMLInputElement,
              searchDrawing : HTMLButtonElement, log : HTMLDivElement) {

  val view = new CanvasPrinter(canvasElement)
  val editor = new Editor(editorDiv, this)
  val canvas = new Canvas(canvasElement, editor, view)
  val omnibox = new Omnibox(title, editor, canvas)

  @JSExport
  def init() : Unit = {
    searchDrawing.onclick = (e : MouseEvent) => {
      omnibox.loadDrawing(title.value)
    }

    view.init()
    editor.updateView()
  }

  @JSExport
  def getDrawings() : js.Array[String] = new JSRichGenTraversableOnce[String](Drawing.drawings).toJSArray

  @JSExport
  def render() : Unit = {
    editor.updateView()
  }

  @JSExport
  def save() : Unit = {
    displaySuccess(editor.module().save(Ajax).toString)
  }

  @JSExport
  def printPdf(name : String) : Unit = {
    val printer = new PdfPrinter()
    canvas.render(editor.getAst, printer)
    printer.save(name)
  }

  @JSExport
  def zoom(delta : Double, e : MouseEvent) : Unit = {
    canvas.zoom(delta, e)
  }

  def displayError(error : String): Unit = {
    log.classList.remove("success")
    log.classList.add("error")
    log.innerHTML = error
  }

  def displaySuccess(success : String = ""): Unit = {
    log.classList.remove("error")
    log.classList.add("success")
    log.innerHTML = success
  }

}