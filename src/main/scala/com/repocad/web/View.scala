package com.repocad.web

import com.repocad.reposcript.parsing.Expr
import com.repocad.util.{Paper, Vector2D}

/**
  * A view that can display an Abstract Syntax Tree (AST) by rendering it on a surface (usually via a
  * [[com.repocad.web.Printer]]).
  */
trait View {

  /**
    * A [[Paper]] in an A-format.
    *
    * @return The paper giving the current scale and size of this view.
    */
  def paper: Paper

  /**
    * The renderer of this view.
    */
  val printer: Printer[_]

  /**
    * Renders the given AST.
    *
    * @param ast The abstract syntax tree to render.
    */
  def render(ast: Expr) {
    render(ast, printer)
  }

  /**
    * Renders the given AST on the given printer.
    *
    * @param ast     The abstract syntax tree to render.
    * @param printer The medium to render the AST on.
    */
  def render(ast: Expr, printer: Printer[_]): Unit = {
    printer.prepare() //redraw the canvas
    Reposcript.evaluate(ast, printer)
    printer.execute()
  }

  /**
    * @return A base64 encoded URL of the current drawing.
    */
  def toPngUrl: String

  /**
    * Zooms the view to the given position.
    *
    * @param delta  The delta to zoom. 0 > delta < 1 to zoom out. 1 > delta to zoom in. Cannot be less than zero.
    * @param center The center of the zoom operation.
    */
  def zoom(delta: Double, center: Vector2D): Unit

  /**
    * Reset the zoom and pan to cover the entire drawing.
    */
  def zoomExtends(): Unit

}
