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

  //TODO: allow setting a fixed paper scale in the script: eg. by typing "paperScale = 2
  def calcPaperScale = 1

  def drawPaper() : Unit = {
    //TODO: re-scale paper to match current print-scale (depending on the bounding box of the artwork present)

    val pH = paperH * calcPaperScale
    val pW = paperW * calcPaperScale
    //paper color
    context.fillStyle = "White"
    context.fillRect(-pH/2 ,-pW/2,pH, pW)

    //draw paper outline
    line(-pH/2,-pW/2,pH/2,-pW/2)
    line(pH/2,-pW/2,pH/2,pW/2)
    //bottom
    line(pH/2,pW/2,-pH/2,pW/2)
    //left
    line(-pH/2,pW/2,-pH/2,-pW/2)
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
    val delta = 1 + (level * 0.15)
    val mousePoint = Vector2D(pointX - center.x, pointY - center.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(delta, delta)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

}
