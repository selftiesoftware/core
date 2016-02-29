package com.repocad.web

import com.repocad.reposcript.parsing._
import com.thoughtworks.binding.Binding.Var
import com.thoughtworks.binding.{Binding, dom}
import org.scalajs.dom.raw.{Event, HTMLDivElement, HTMLInputElement, Node}

import scala.scalajs.js.annotation.JSExport

@JSExport("EditorApp")
class EditorApp(drawingTitle: String, parent: HTMLDivElement) extends Editor {

  override val ast: Var[Either[Error, Expr]] = Var(Right(UnitExpr))
  override val drawing: Var[Drawing] = Var(Drawing.get(drawingTitle).right.get)

  ast := Reposcript.parse(drawing.get.content).right.map(_.expr)

  @JSExport
  def withSlider(variable: String, min: Int, max: Int): EditorApp = {
    dom.render(parent, slider(variable.toLowerCase(), min, max))
    this
  }

  @JSExport
  def withText(variable: String) : EditorApp = {
    this
  }

  @dom def slider(variable: String, min: Int, max: Int): Binding[Node] = {
    <input type="range" min={min.toString} max={max.toString} oninput={ event: Event =>
      val target = event.target.asInstanceOf[HTMLInputElement]
      updateAst(variable, d => DefExpr(d.name, NumberExpr(target.valueAsNumber)))
    }>Hi</input>
  }

  @dom def textInput(variable: String): Binding[Node] = {
    <input type="test" defaultValue="Text input here" onchange={ event: Event =>
    val target = event.target.asInstanceOf[HTMLInputElement]
    updateAst(variable, d => DefExpr(d.name, StringExpr(target.value)))
    }></input>
  }

  private def updateAst(definitionName: String, f: DefExpr => DefExpr): Unit = {
    ast := ast.get.right.map(expr => substitute(expr, definitionName, f))
  }

  private def substitute(expr: Expr, definitionName: String, f: DefExpr => DefExpr): Expr = {
    expr match {
      case BlockExpr(exprs) => BlockExpr(exprs.map(e => substitute(e, definitionName, f)))
      case DefExpr(x, y) if x == definitionName => f(DefExpr(x, y))
      case _ => expr
    }
  }

}
