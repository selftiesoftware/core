package com.repocad.web.html

import com.repocad.web.evaluating.Evaluator
import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing.{UnitExpr, Parser, Expr}
import com.repocad.web.{Printer, Drawing}
import org.scalajs.dom.raw.{HTMLTextAreaElement, HTMLDivElement}
import org.scalajs.dom.Event
import rx.core.Var

import scala.scalajs.js.Dynamic

/**
 * An editor for Reposcript
 */
class Editor(container : HTMLDivElement, defaultPrinter : Printer) {

  val module = Var(Drawing())
  
  val lastAst = Var[Expr](UnitExpr)

  val textarea = container.ownerDocument.createElement("textarea").asInstanceOf[HTMLTextAreaElement]

  container.appendChild(textarea)
  textarea.style.width = "100%"
  textarea.style.height = scalajs.js.Dynamic.global.window.innerHeight.toString.toDouble * 0.7 - 52 + "px"

  textarea.onkeyup = (e : Event) => {
    if (module().content != textarea.value) {
      module() = module().copy(content = textarea.value)
      evaluate(defaultPrinter, useCache = false)
    }
  }

  def setDrawing(drawing : Drawing): Unit = {
    module() = drawing
    textarea.value = drawing.content
    evaluate(defaultPrinter, useCache = false)
  }

  /**
   * Evaluates the content of the editor on the given printer. If ``useCache`` is set to true, we lex and parse the
   * content of the editor, if set to false we use the latest AST, generated from the last run.
   * @param printer the medium on which to print
   * @param useCache whether or not to lex and parse the current content (false) or only the cache (true). Defaults
   *                 to true
   */
  def evaluate(printer : Printer = defaultPrinter, useCache : Boolean = true): Unit = {
    printer.prepare()
    val expr : Parser.Value = if (!useCache) {
      val tokens = Lexer.lex(module().content)
      Parser.parse(tokens)
    } else {
      Right(lastAst())
    }
      
    expr.fold(left => displayError("Error while compiling code: " + left),
        ast => {
          lastAst() = ast
          Evaluator.eval(ast, printer).fold(
            error => displayError(s"Failure during evaluation: $error"),
            success => {
              displaySuccess()
            })
        })
  }

  def displayError(error : String): Unit = {
    //debug.innerHTML = error
  }

  def displaySuccess(success : String = ""): Unit = {
    //debug.innerHTML = success
  }

}
