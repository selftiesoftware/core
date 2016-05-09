package com.repocad.web

import com.repocad.reposcript.parsing.{Error, Expr, UnitExpr}
import com.thoughtworks.binding.Binding.{BindingInstances, Var}
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

  /**
    * The result of a Abstract Syntax Tree (AST) as a [[com.thoughtworks.binding.Binding]], i. e. reactive.
    */
  val ast: Var[Either[Error, Expr]] = Var(Right(UnitExpr))

  BindingInstances.bind(ast) { boundAst =>
    boundAst match {
      case Right(UnitExpr) => //Do nothing
      case Right(expr) =>
        view.render(expr)
        displaySuccess("Success")

      case Left(err) => displayError(err.message)
    }
    ast
  }.watch()

  BindingInstances.bind(editor.drawing) { drawing =>
    ast := parse(drawing, useCache = false)
    if (drawing.name != drawingTitle) {
      ast.get.right.foreach(view.render)
      view.zoomExtends()
    }
    drawingTitle = drawing.name
    editor.drawing
  }.watch()

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
  def getDrawings(): js.Array[String] = Drawing.javascriptDrawings

  /**
    * Parses the content of the editor to an AST. If ``useCache`` is set to false, we lex and parse the
    * content of the editor, if set to true we re-use the latest AST, generated from the last run.
    *
    * @param drawing  The drawing to parse. Defaults to the current drawing
    * @param useCache Whether or not to lex and parse the current content (false) or only the cache (true). Defaults
    *                 to true
    * @return an AST on success or an error message
    */
  def parse(drawing: Drawing = editor.drawing.get, useCache: Boolean = true): Either[Error, Expr] = {
    if (!useCache) {
      Reposcript.parse(drawing.content).right.map(_.expr)
    } else {
      ast.get
    }
  }

  @JSExport
  def printPdf(name: String): Unit = {
    ast.get.right.foreach(thisAst => {
      try {
        val printer = new PdfPrinter(view.printer.paper)
        view.render(thisAst, printer)
        printer.save(name)
      } catch {
        case e: Exception => println(e)
      }
    })
  }

  //PNG generator - used to add a thumbnail in the library when the drawing is saved to Github.
  @JSExport
  def printPng(): String = {
    view match {
      case c: CanvasView => c.toPngUrl
      case e => throw new RuntimeException("Failed to export to png; Not supported in view type " + e)
    }
  }

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
    if (ast.get.isRight) {
      val pngText = printPng()
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
  def setLog(log: HTMLDivElement): Repocad = {
    this.logOption = Some(log)
    this
  }

}

object Repocad {

  val version = 0.2

}