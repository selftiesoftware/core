package com.repocad.web

import com.repocad.web.rendering.{Canvas, Editor, Omnibox}
import org.scalajs.dom.MouseEvent
import org.scalajs.dom.raw.{HTMLButtonElement, HTMLCanvasElement, HTMLDivElement, HTMLInputElement}

import scala.scalajs.js
import scala.scalajs.js.Dynamic
import scala.scalajs.js.JSConverters.JSRichGenTraversableOnce
import scala.scalajs.js.annotation.JSExport
import scala.util.{Failure, Success}

import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue

/**
 * The entry point for compiling and evaluating repocad code
 *
 *              TODO: Version numbers for AST!
 *              TODO: Import versioned compilers on request
 *
 */
@JSExport("Repocad")
class Repocad(canvasElement : HTMLCanvasElement, editorDiv : HTMLDivElement, title : HTMLInputElement,
              searchDrawing : HTMLButtonElement, newDrawing : HTMLButtonElement, log : HTMLDivElement) {

  val view = new CanvasPrinter(canvasElement)
  val editor = new Editor(editorDiv, this)
  val canvas = new Canvas(canvasElement, editor, view)
  val omnibox = new Omnibox(title, editor, canvas)

  @JSExport
  def init() : Unit = {
    searchDrawing.onclick = (e : MouseEvent) => {
      omnibox.loadDrawing(title.value)
    }

    newDrawing.onclick = (e : MouseEvent) => {
      val name = Dynamic.global.prompt("Please write the name of the new drawing")
      if (name != null) {
        omnibox.loadDrawing(name.toString)
      }
    }

    view.init()
    editor.updateView()
  }

  @JSExport
  def getDrawings() : js.Array[String] = Drawing.javascriptDrawings

  @JSExport
  def render() : Unit = {
    editor.updateView()
  }

  @JSExport
  def save() : Unit = {
    val future = editor.module().save(Ajax)
    future.onComplete(_ match {
      case Success(response) => displaySuccess(s"'${editor.module().name}' saved to www.github.com/repocad/lib")
      case Failure(error) => displayError(s"Error when saving ${editor.module().name}: $error")
    })
    val pngText = canvas.toPngUrl
    println(pngText)
    val futurePng = editor.module().saveThumbnail(Ajax, pngText)

    futurePng.onComplete(_ match {
      case Success(response) => displaySuccess(s"'${editor.module().name}' saved to www.github.com/repocad/lib")
      case Failure(error) => displayError(s"Error when saving ${editor.module().name}: $error")
    })
  }

  @JSExport
  def printPdf(name : String) : Unit = {
    val printer = new PdfPrinter(view.getPaper)
    canvas.render(editor.getAst, printer)
    printer.save(name)
  }

  //PNG generator - used to add a thumbnail in the library when the drawing is saved to Github.
  @JSExport
  def printPng() = {
    canvas.toPngUrl
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