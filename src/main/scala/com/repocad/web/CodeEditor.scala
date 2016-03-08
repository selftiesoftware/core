package com.repocad.web

import com.repocad.reposcript.parsing.{Error, Expr, UnitExpr}
import com.thoughtworks.binding.Binding.Var
import org.scalajs.dom.Event
import org.scalajs.dom.raw.HTMLDivElement

import scala.scalajs.js
import scala.scalajs.js.annotation.JSExport

/**
  * An [[Editor]] for Reposcript where the AST is generated through manipulating RepoScript.
  */
@JSExport("CodeEditor")
class CodeEditor(container: HTMLDivElement) extends Editor {

  private val errorClass = "line-error"

  private var lastError: Option[Error] = None

  val drawing: Var[Drawing] = Var[Drawing](Drawing())

  val codeMirrorHeight = js.Dynamic.global.window.innerHeight.toString.toDouble * 0.7 + "px"

  val codeMirrorSettings = js.Dynamic.literal("mode" -> "reposcript", "lineNumbers" -> true)
  val codeMirror: js.Dynamic = js.Dynamic.global.CodeMirror(container, codeMirrorSettings)

  js.Dynamic.global.cm = codeMirror

  codeMirror.setSize("100%", codeMirrorHeight)

  codeMirror.on("change", (e: Event) => {
    val newCode: String = codeMirror.getValue().toString
    if (drawing.get.content != newCode) {
      drawing := drawing.get.copy(content = newCode)
    }
  })

  //
  //  codeMirror.on("mouseover", () => {
  //    val mouse = codeMirror.getCursor()
  //    val range = codeMirror.findWordAt(mouse)
  //    console.log(codeMirror)
  //    console.log(range)
  //    val word = codeMirror.getRange(range.anchor, range.head)
  //    console.log(word)
  //  })

  def clearError(): Unit = {
    lastError.foreach(error => codeMirror.getDoc().removeLineClass(getLineNumber(error), "background", errorClass))
    lastError = None
  }

  def displayError(error: Error): Unit = {
    if (lastError.isEmpty || lastError.exists(_ != error)) {
      clearError()
      lastError = Some(error)

      codeMirror.addLineClass(getLineNumber(error), "background", errorClass)
    }
  }

  def displaySuccess(expr: Expr): Unit = {
    clearError()
  }

  private def getLineNumber(error: Error): js.Any = {
    if (error.position.lineNumber == Integer.MAX_VALUE) {
      codeMirror.getDoc().lastLine()
    } else {
      js.Any.fromDouble(error.position.lineNumber.toDouble)
    }
  }

  def setDrawing(drawing: Drawing): Unit = {
    this.drawing := drawing
    codeMirror.setValue(drawing.content)
  }


}
