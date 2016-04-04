package com.repocad.printer

import com.repocad.reposcript.Renderer
import com.repocad.util.Paper

import scala.scalajs.js

/**
  * Prints objects on a paper media.
  */
trait Printer[T, P <: Paper] extends Renderer {

  val context: T
  def paper: P

  private var actions: Seq[T => Unit] = Nil

  /**
    * Draws the paper
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
