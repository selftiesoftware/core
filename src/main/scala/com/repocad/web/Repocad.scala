package com.repocad.web

import com.thoughtworks.binding.Binding.BindingInstances
import org.scalajs.dom.raw.HTMLDivElement

import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue
import scala.scalajs.js
import scala.scalajs.js.annotation.JSExport
import scala.util.{Failure, Success}

/**
  * The entry point for compiling and evaluating repocad code
  *
  * TODO: Version numbers for AST!
  * TODO: Import versioned compilers on request
  *
  */
@JSExport("Repocad")
class Repocad(view: View, editor: Editor) {

  private var logOption: Option[HTMLDivElement] = None
  private var drawingTitle: String = ""

  @JSExport
  def init() {
    BindingInstances.bind(editor.drawing) { drawing =>
      if (drawing.name != drawingTitle) {
        view.zoomExtends()
      }
      drawingTitle = drawing.name
      editor.drawing
    }.watch()

    BindingInstances.bind(editor.ast) { ast =>
      ast match {
        case Right(expr) =>
          view.render(expr)
          displaySuccess()

        case Left(err) => displayError(err.message)
      }
      editor.ast
    }.watch()

    editor.ast.get.right.foreach(view.render)
  }

  @JSExport
  def getDrawings(): js.Array[String] = Drawing.javascriptDrawings

  @JSExport
  def save(): Unit = {
      val future = editor.drawing.get.save(Ajax)
      future.onComplete({
        case Success(response) => displaySuccess(s"'${
          editor.drawing.get.name
        }' saved to www.github.com/repocad/lib")
        case Failure(error) => displayError(s"Error when saving ${
          editor.drawing.get.name
        }: $error")
      })

    // Only save thumbnail if drawing compiles
    if (editor.ast.get.isRight) {
      val pngText = view.toPngUrl
      val futurePng = editor.drawing.get.saveThumbnail(Ajax, pngText)

      futurePng.onComplete({
        case Success(response) => displaySuccess(s"'${
          editor.drawing.get.name
        }' saved to www.github.com/repocad/lib")
        case Failure(error) => displayError(s"Error when saving ${
          editor.drawing.get.name
        }: $error")
      })
    }
  }

  @JSExport
  def printPdf(name: String): Unit = {

    editor.ast.get.right.foreach(ast => {
      val printer = new PdfPrinter(view.paper)
      view.render(ast, printer)
      printer.save(name)
    })
  }

  //PNG generator - used to add a thumbnail in the library when the drawing is saved to Github.
  @JSExport
  def printPng() = {
    view.toPngUrl
  }

  def displayError(error: String): Unit = {
    logOption.foreach(log => {
      log.classList.remove("success")
      log.classList.add("error")
      log.innerHTML = error.toString
    })
  }

  def displaySuccess(success: String = ""): Unit = {
    logOption.foreach(log => {
      log.classList.remove("error")
      log.classList.add("success")
      log.innerHTML = success
    })
  }

  @JSExport
  def setLog(log : HTMLDivElement) : Repocad = {
    this.logOption = Some(log)
    this
  }

}

object Repocad {

  val version = 0.2

}