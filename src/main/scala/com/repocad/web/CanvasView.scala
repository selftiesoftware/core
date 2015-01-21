package com.repocad.web

import com.repocad.web.Paper._
import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

/**
 * A view that renders to a HTML5 canvas
 * @param canvas  The HTML canvas element
 */
class CanvasView(canvas : HTMLCanvasElement) extends Printer {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
  var landscape = false

  //window center
  def windowCenter = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  /**
   * Draw a white rectangle representing the drawing if it is printed
   */
  def drawPaper() = {

    context.fillStyle = "white"
    landscape = scaleAndRotation() //run the scale and rotation evaluation

    if(landscape) {
      val x = drawingCenter.x - (paperSize(1) * paperScale) /2
      val y = -drawingCenter.y - (paperSize(0) * paperScale) /2
      context.fillRect(x, y, paperSize(1) * paperScale, paperSize(0) * paperScale)
    } else {
      val x = drawingCenter.x - (paperSize(0) * paperScale) /2
      val y = -drawingCenter.y - (paperSize(1) * paperScale) /2
      context.fillRect(x, y, paperSize(0) * paperScale, paperSize(1) * paperScale)
    }
    //draw paper outline here...
  }

  def clear(): Unit = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = "AliceBlue"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()
    drawPaper() //draw the paper
  }

  def init(): Unit = {
    context.translate(canvas.width / 2, canvas.height / 2)
    drawPaper() //redraw the paper
  }

  /**
   * Display a custom text on a given position on the screen, Used for development and debugging purposes
   * @param x position on the x axis
   * @param y position on the y axis
   * @param t string to display
   */
  def textDot(x: Double, y: Double, t : String) = {
    //context.save()
    //context.setTransform(1, 0, 0, 1, 0, 0)
    //context.fillStyle = "Black"
    //context.fillRect(x, y, 80, 20)
    //context.restore()
    val myFont = 20.toString() + "pt Serif"
    context.font = myFont
    //context.font(1)
    //context.textAlign("left")
    //context.textBaseline("bottom")
    context.fillText(t.toString(), x, -y)
  }

  override def arc(x: Double, y: Double, r: Double, sAngle : Double, eAngle : Double): Unit = {
    context.beginPath()
    context.arc(x, -y, r, sAngle, eAngle)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
    context.closePath()
  }

  override def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    context.beginPath()
    context.moveTo(x1, -y1)
    context.bezierCurveTo(x2, -y2, x3, -y3, x4, -y4)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, -y1)
    context.lineTo(x2, -y2)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
    context.closePath()
  }

  override def circle(x: Double, y: Double, r: Double): Unit = {
    context.beginPath()
    context.arc(x, -y, r, 0, 2 * Math.PI)
    context.lineWidth = 0.2 * paperScale
    context.stroke()
    context.closePath()
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Unit = {
    val correctedH = h / 1.5
    val myFont = correctedH.toString() + "px Arial"
    context.font = myFont
    context.fillStyle = "black"
    //context.font(1)
    //context.textAlign("left")
    //context.textBaseline("bottom")
    context.fillText(t.toString(), x, -y)
  }

  def translate(x : Double, y : Double) : Unit = {
    context.translate(x, y)
  }

  def zoom(level : Double, pointX : Double, pointY : Double) : Unit = {
    val delta = 1 + (level * 0.15)
    val mousePoint = Vector2D(pointX - windowCenter.x, pointY - windowCenter.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(delta, delta)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

}
