package com.repocad.web.rendering

import com.repocad.reposcript.Printer
import com.repocad.reposcript.parsing.{Expr, UnitExpr}
import com.repocad.web.{Drawing, Reposcript}
import org.scalajs.dom._
import org.scalajs.dom.raw.HTMLDivElement
import rx.core.Var

import scala.scalajs.js

/**
 * An editor for Reposcript
 */
class Editor(container : HTMLDivElement, printer : Printer[_]) {

  val module = Var(Drawing())
  
  private val ast = Var[Expr](UnitExpr)

  //textarea.style.height = js.Dynamic.global.window.innerHeight.toString.toDouble * 0.7 - 52 + "px"

  val codeMirror = js.Dynamic.global.CodeMirror(container)

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
      Reposcript.parse(module().content).right.map(tuple => {
        ast() = tuple._1
        tuple._1
      }).left.map(error => { println("Error when parsing: " + error); error })
    } else {
      Right(ast())
    }
  }

  def updateView(): Unit = {
    printer.prepare() //redraw the canvas
    //Evaluator.resetBoundingBox() //set the default paper scale
    Reposcript.evaluate(ast(), printer)
    printer.execute()
  }

}
