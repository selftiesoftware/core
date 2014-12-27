package com.siigna.web

import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

import scala.scalajs.js

/**
 * A view that renders to a HTML5 canvas
 * @param canvas  The HTML canvas element
 */
class CanvasView(canvas : HTMLCanvasElement) extends Printer {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
  val paperH = 210
  val paperW = 297

  def center = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  def clear(): Unit = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = "AliceBlue"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()
    drawPaper()
  }

  def init(): Unit = {
    context.translate(canvas.width / 2, canvas.height / 2)
  }

  def drawPaper() : Unit = {
    //paper color
    context.fillStyle = "White"
    context.fillRect(-paperH/2,-paperW/2,paperH, paperW)

    //draw paper outline
    line(-paperH/2,-paperW/2,paperH/2,-paperW/2)
    line(paperH/2,-paperW/2,paperH/2,paperW/2)
    //bottom
    line(paperH/2,paperW/2,-paperH/2,paperW/2)
    //left
    line(-paperH/2,paperW/2,-paperH/2,-paperW/2)
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.closePath()
  }

  def translate(x : Double, y : Double) : Unit = {
    context.translate(x, y)
  }

  def zoom(level : Double, pointX : Double, pointY : Double) : Unit = {
    val delta = 1 + (level * 0.05)
    val mousePoint = Vector2D(pointX - center.x, pointY - center.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(delta, delta)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

}
