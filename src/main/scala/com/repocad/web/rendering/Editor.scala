package com.repocad.web.rendering

import com.repocad.web.evaluating.Evaluator
import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing.{Parser, UnitExpr, Expr}
import com.repocad.web.{Drawing, Printer}
import org.scalajs.dom._
import org.scalajs.dom.raw.{HTMLDivElement, HTMLTextAreaElement}
import rx.core.Var

/**
 * An editor for Reposcript
 */
class Editor(container : HTMLDivElement, printer : Printer[_]) {

  val module = Var(Drawing())
  
  private val ast = Var[Expr](UnitExpr)

  val textarea = container.ownerDocument.createElement("textarea").asInstanceOf[HTMLTextAreaElement]

  container.appendChild(textarea)
  textarea.style.width = "100%"
  textarea.style.height = scalajs.js.Dynamic.global.window.innerHeight.toString.toDouble * 0.7 - 52 + "px"

  textarea.onkeyup = (e : Event) => {
    if (module().content != textarea.value) {
      module() = module().copy(content = textarea.value)
      parse(false)
      updateView()
    }
  }

  def getAst : Expr = ast()

  def setDrawing(drawing : Drawing): Unit = {
    module() = drawing
    textarea.value = drawing.content
    parse(false)
  }

  /**
   * Parses the content of the editor to an AST. If ``useCache`` is set to true, we lex and parse the
   * content of the editor, if set to false we use the latest AST, generated from the last run.
   * @param useCache whether or not to lex and parse the current content (false) or only the cache (true). Defaults
   *                 to true
   * @return an AST on success or an error message
   */
  def parse(useCache : Boolean = true): Parser.Value = {
    if (!useCache) {
      val tokens = Lexer.lex(module().content)
      Parser.parse(tokens).right.map(newAst => {
        ast() = newAst
        newAst
      })
    } else {
      Right(ast())
    }
  }

  def updateView(): Unit = {
    printer.prepare() //redraw the canvas
    //Evaluator.resetBoundingBox() //set the default paper scale
    Evaluator.eval(ast(), printer)
    printer.execute()
  }

}
