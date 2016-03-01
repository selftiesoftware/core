package com.repocad.web

import com.repocad.reposcript.parsing._
import com.thoughtworks.binding.Binding.Var
import org.scalajs.dom.raw.{Event, HTMLDivElement, HTMLInputElement}

import scala.scalajs.js.annotation.JSExport

@JSExport("EditorApp")
class EditorApp(drawingTitle: String, parent: HTMLDivElement) extends Editor {

  override val ast: Var[Either[Error, Expr]] = Var(Right(UnitExpr))
  override val drawing: Var[Drawing] = Var(Drawing.get(drawingTitle).right.get)

  private var astVariables = Map[String, DefExpr]()

  ast := Reposcript.parse(drawing.get.content).right.map(_.expr)

  private var bareAst : Expr = ast.get.right.get

  @JSExport
  def withSlider(slider: HTMLInputElement, variable: String): EditorApp = {
    astVariables += variable -> DefExpr(variable, NumberExpr(slider.valueAsNumber))
    filterAst(DefExpr(variable, NumberExpr(slider.valueAsNumber)))
    slider.oninput = { event: Event =>
      val target = event.target.asInstanceOf[HTMLInputElement]
      astVariables = astVariables.updated(variable, DefExpr(variable, NumberExpr(target.valueAsNumber)))
      updateAst()
    }
    this
  }

  @JSExport
  def withText(input: HTMLInputElement, variable: String): EditorApp = {
    astVariables += variable -> DefExpr(variable, StringExpr(input.value))
    filterAst(DefExpr(variable, StringExpr(input.value)))
    input.oninput = { event: Event =>
      val target = event.target.asInstanceOf[HTMLInputElement]
      astVariables = astVariables.updated(variable, DefExpr(variable, StringExpr(target.value)))
      updateAst()
    }
    this
  }

  private def filterAst(definition: DefExpr): Unit = {
    var found = false
    val newAst = bareAst match {
      case BlockExpr(exprs) => BlockExpr(exprs.filter({
        case DefExpr(name, value) if name == definition.name && value.t == definition.value.t =>
          found = true
          false
        case _ => true
      }))
      case rest => rest
    }
    if (!found) {
      println(s"Could not find definition ${definition.name} with type ${definition.value.t} in the drawing")
    } else {
      bareAst = newAst
      updateAst()
    }
  }

  private def updateAst(): Unit = {
    ast := Right(BlockExpr(astVariables.values.toSeq :+ bareAst))
  }

}
