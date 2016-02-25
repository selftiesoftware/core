package com.repocad.web

import com.repocad.reposcript.parsing._
import com.thoughtworks.binding.Binding.Var
import com.thoughtworks.binding.{Binding, dom}
import org.scalajs.dom.raw.{Event, HTMLDivElement, HTMLInputElement, Node}

import scala.scalajs.js.annotation.JSExport

@JSExport("EditorApp")
class EditorApp(drawingTitle: String, parent: HTMLDivElement) extends Editor {

  override val ast: Var[Either[Error, Expr]] = Var(Right(UnitExpr))
  override val drawing: Var[Drawing] = Var(new Drawing("test", "def a = 10 line(0 0 a 10)"))

  ast := Reposcript.parse(drawing.get.content).right.map(_.expr)

  @JSExport
  def withSlider(variable: String): EditorApp = {
    dom.render(parent, slider(variable))
    this
  }

  @dom def slider(variable: String): Binding[Node] = {
    <input type="range" min="-100" max="100" oninput={ event: Event =>
      val target = event.target.asInstanceOf[HTMLInputElement]
      updateAst(variable, target.valueAsNumber)
    }>Hi</input>
  }

  def parameterise(variable: String): Int => Expr = {
    value => substitute(ast.get.right.get, variable, value)
  }

  def updateAst(definitionName: String, value: Int): Unit = {
    ast := ast.get.right.map(expr => substitute(expr, definitionName, value))
  }

  def substitute(expr: Expr, definitionName: String, value: Int): Expr = {
    expr match {
      case BlockExpr(exprs) => BlockExpr(exprs.map(e => substitute(e, definitionName, value)))
      case DefExpr(x, NumberExpr(_)) if x == definitionName => DefExpr(x, NumberExpr(value))
      case _ => expr
    }
  }

}
