package com.repocad.printer

import com.repocad.reposcript.Renderer
import com.repocad.util.{Paper, Rectangle2D}

/**
  * Prints objects on a paper media.
  */
trait Printer[T] extends Renderer {

  val context: T

  /**
    * A [[com.repocad.util.Paper]].
    *
    * @return The paper giving the current scale and size of this view.
    */
  def paper: Paper

  /**
    * The ratio between one unit in the drawing and one unit in real life.
    *
    * @return An instance of a Scale.
    */
  def scale: Scale = Scale(boundary, paper)

  def boundary: Rectangle2D

  private var actions: Seq[T => Unit] = Nil

  final protected def addAction(f: T => Unit): Unit = {
    actions :+= f
  }

  def execute(): Unit = {
    actions.foreach(_.apply(context))
  }

  def prepare(): Unit = {
    actions = Nil
  }

}
