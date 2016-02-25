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

  @dom def slider(variable: String, min: Int, max: Int): Binding[Node] = {
    <input type="range" min={min.toString} max={max.toString} oninput={ event: Event =>
      val target = event.target.asInstanceOf[HTMLInputElement]
      updateAst(variable, target.valueAsNumber)
    }>Hi</input>
  }

  private def updateAst(definitionName: String, value: Int): Unit = {
    ast := ast.get.right.map(expr => substitute(expr, definitionName, value))
  }

  private def substitute(expr: Expr, definitionName: String, value: Int): Expr = {
    expr match {
      case BlockExpr(exprs) => BlockExpr(exprs.map(e => substitute(e, definitionName, value)))
      case DefExpr(x, NumberExpr(_)) if x == definitionName => DefExpr(x, NumberExpr(value))
      case _ => expr
    }
  }

}
