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

  var landscape = false //paper orientation



  //window center
  def windowCenter = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  /**
   * Draw a white rectangle representing the drawing if it is printed
   */
  def drawPaper() = {

    canvasCorner = Vector2D(canvas.getBoundingClientRect().left,canvas.getBoundingClientRect().top)

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
    //DEBUGGING

    //screenText(5,6,"paper center from canvas corner: "+panVector)

    //canvas center in canvas coordinates
    //screenText(5,6,canvasCorner)

    //mouse position in canvas coordinates
    //screenText(5,12,"mouse from canvas corner: "+mouseCanvas)
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
    val myFont = 10.toString() + "pt Arial"
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

  def screenText (x: Double, y: Double, t: Any): Unit = {
    context.font = "100 px Arial"
    context.fillStyle = "black"
    context.save()
    context.setTransform(5, 0, 0, 5, 0, 0)
    context.fillText(t.toString(), x, y)
    context.restore()
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

  /**
   * Carries out a zoom action by zooming with the given delta and then panning
   * the view relative to the current zoom-factor.
   * The zoom-function are disabled if the zoom level are below 0.00001 or above 50
   * Also, if the delta is cropped at (+/-)10, to avoid touch-pad bugs with huge deltas etc.
   * The zoom is logarithmic (base 2) since linear zooming gives some very brutal zoom-steps.
   *
   * @param delta  The current zoom delta (1 or -1) as received from the mouse wheel / touch pad via js
   * @param pointX  The center X for the zoom-operation
   * @param pointY  The center Y for the zoom-operation
   */

  def zoom(delta : Double, pointX : Double, pointY : Double) {

    val increment = 0.15
    //TODO: put .1767 on a formula..
    val zoomScale = if(delta == -1) 1 + (delta * increment) else 1 + (delta * 0.1767) //zoom in needs to be bigger
    val mousePoint = Vector2D(pointX - windowCenter.x, pointY - windowCenter.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(zoomScale, zoomScale)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

  /**
   * Sets the pan and zoom level to include the entire paper. Useful when a large import has occurred or similar.
   * @param boundary  The drawing boundary to use.
   */
  def zoomExtends(centerX : Double, centerY : Double) {
    //zoom = math.max(View.width, View.height) / math.max(drawing.boundary.width, drawing.boundary.height) * 0.5 // 20% margin
    //val translateX = centerX * zoom
    //val translateY = centerY * zoom


  }

}
