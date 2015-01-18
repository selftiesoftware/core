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

  def center = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)


  /**
   * The boundary from the current content of the Model.
   * The rectangle returned fits an A-paper format, but <b>a margin is added</b>.
   * This is done in order to make sure that the print viewed on page is the
   * actual print you get.
   *
   * @return A rectangle in an A-paper format. The scale is given in <code>boundaryScale</code>.
   */


  def drawPaper() = {

    val t : TransformationMatrix = new TransformationMatrix(0,0,0,0,0,0)

    //TODO: re-scale paper to match current print-scale (depending on the bounding box of the artwork present)
    val wMin : Double = Evaluator.minX
    val wMax : Double = Evaluator.maxX
    val hMin : Double = Evaluator.minY
    val hMax : Double = Evaluator.maxY

    val center = Evaluator.center

    //calculate the paper scale and placement
    val paperCoords = scaleAndCoords(wMin,wMax,hMin,hMax)
    val y = paperCoords(1)
    val x = paperCoords(0)
    val height = paperCoords(2)
    val width = paperCoords(3)
    context.fillStyle = "white"
    context.fillRect(y,x,height, width)

    val y2 = y + height
    val x2 = x + width
    //draw paper outline
    //line(y,x,y2,x)
    //line(y2,x,y2,x2)
    //bottom
    //line(y2,x2,y,x2)
    //left
    //line(y,x2,y,x)
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

  }

  override def arc(x: Double, y: Double, r: Double, sAngle : Double, eAngle : Double): Unit = {
    context.beginPath()
    context.arc(x, -y, r, sAngle, eAngle)
    context.lineWidth = 0.2
    context.stroke()
    context.closePath()
  }

  override def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    context.beginPath()
    context.moveTo(x1, -y1)
    context.bezierCurveTo(x2, -y2, x3, -y3, x4, -y4)
    context.stroke()
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, -y1)
    context.lineTo(x2, -y2)
    context.stroke()
    context.lineWidth = 0.2
    context.closePath()
  }

  override def circle(x: Double, y: Double, r: Double): Unit = {
    context.beginPath()
    context.arc(x, -y, r, 0, 2 * Math.PI)
    context.lineWidth = 0.2
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
    val mousePoint = Vector2D(pointX - center.x, pointY - center.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(delta, delta)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

}
