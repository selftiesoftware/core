package com.repocad.web

import com.repocad.reposcript.Renderer

/**
  * Prints objects on a paper media.
  */
trait Printer[T] extends Renderer {

  val context: T

  private var actions: Seq[T => Unit] = Nil

  /**
    * Draws a paper
    */
  protected def drawPaper(): Unit

  final protected def addAction(f: T => Unit): Unit = {
    actions :+= f
  }

  final def execute(): Unit = {
    drawPaper()
    actions.foreach(_.apply(context))
  }

  def prepare(): Unit = {
    actions = Nil
  }

}
