package com.repocad.web.rendering

import com.repocad.reposcript.Printer
import com.repocad.reposcript.parsing.{Expr, UnitExpr}
import com.repocad.web.{Repocad, Drawing, Reposcript}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLDivElement
import rx.core.Var

import scala.scalajs.js

/**
 * An editor for Reposcript
 */
class Editor(container : HTMLDivElement, repoCad : Repocad) {

  val module = Var(Drawing())
  val printer = repoCad.view
  private val ast = Var[Expr](UnitExpr)

  val codeMirrorHeight = js.Dynamic.global.window.innerHeight.toString.toDouble * 0.7 + "px"

  val codeMirrorSettings = js.Dynamic.literal("mode" -> "reposcript", "lineNumbers" -> true)
  val codeMirror = js.Dynamic.global.CodeMirror(container, codeMirrorSettings)

  codeMirror.setSize("100%", codeMirrorHeight)

  codeMirror.on("change", (e : Event) => {
    val newCode : String = codeMirror.getValue().toString
    if (module().content != newCode) {
      module() = module().copy(content = newCode)
      parse(false)
      updateView()
    }
  })

  def getAst : Expr = ast()

  def setDrawing(drawing : Drawing): Unit = {
    module() = drawing
    codeMirror.setValue(drawing.content)
    parse(false)
    updateView()
  }

  /**
   * Parses the content of the editor to an AST. If ``useCache`` is set to true, we lex and parse the
   * content of the editor, if set to false we use the latest AST, generated from the last run.
   * @param useCache whether or not to lex and parse the current content (false) or only the cache (true). Defaults
   *                 to true
   * @return an AST on success or an error message
   */
  def parse(useCache : Boolean = true): Either[String, Expr] = {
    if (!useCache) {
      val result = Reposcript.parse(module().content).right.map(tuple => {
        ast() = tuple._1
        tuple._1
      })
      result.fold[Unit](repoCad.displayError, _ => repoCad.displaySuccess("Success"))
      result
    } else {
      Right(ast())
    }
  }

  def updateView(): Unit = {
    printer.prepare() //redraw the canvas
    Reposcript.evaluate(ast(), printer)
    printer.execute()
  }

}
