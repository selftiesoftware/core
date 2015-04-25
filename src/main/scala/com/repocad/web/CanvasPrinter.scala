package com.repocad.web

import com.repocad.web.Paper._
import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.raw.HTMLCanvasElement
import org.scalajs.dom.CanvasRenderingContext2D

/**
 * A view that renders to a HTML5 canvas
 * @param canvas  The HTML canvas element
 */
class CanvasPrinter(canvas : HTMLCanvasElement) extends Printer {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]

  var landscape = false //paper orientation



  //window center
  def windowCenter = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  /**
   * Draw a white rectangle representing the drawing if it is printed
   */
  def drawPaper() = {
    println("drawing the specified paper")
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

    //annotation
    val txt : String = "p a p e r : A 4       s c a l e:   1 :  " + paperScale.toString
    val version : String = "v e r.   0 . 1 5 "
    screenText(5,10,70,txt)
    screenText(370,10,70,version)

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

  //First run...
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
    Evaluator.updateBoundingBox(x + r, y + r)
    Evaluator.updateBoundingBox(x - r, y - r)
    context.beginPath()
    context.arc(x, -y, r, sAngle, eAngle)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
    context.closePath()
  }

  override def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    Evaluator.updateBoundingBox(x1, y1)
    Evaluator.updateBoundingBox(x2, y2)
    Evaluator.updateBoundingBox(x3, y3)
    Evaluator.updateBoundingBox(x4, y4)
    context.beginPath()
    context.moveTo(x1, -y1)
    context.bezierCurveTo(x2, -y2, x3, -y3, x4, -y4)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    Evaluator.updateBoundingBox(x1,y1)
    Evaluator.updateBoundingBox(x2,y2)
    context.beginPath()
    context.moveTo(x1, -y1)
    context.lineTo(x2, -y2)
    context.stroke()
    context.lineWidth = 0.2 * paperScale
    context.closePath()
  }

  override def circle(x: Double, y: Double, r: Double): Unit = {
    Evaluator.updateBoundingBox(x + r, y + r)
    Evaluator.updateBoundingBox(x - r, y - r)
    context.beginPath()
    context.arc(x, -y, r, 0, 2 * Math.PI)
    context.lineWidth = 0.2 * paperScale
    context.stroke()
    context.closePath()
  }

  def prepare(): Unit = {
    clear()
  }

  def screenText (x: Double, y: Double, size: Double, t: Any): Unit = {
    context.font = size.toString + " pt Arial"
    context.fillStyle = "black"
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillText(t.toString(), x, y)
    context.restore()
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Unit = {

    val length = t.toString.length * 0.3 * h
    val correctedH = h / 1.5
    context.save()
    val myFont = correctedH.toString() + "px Arial"
    context.font = myFont
    context.fillStyle = "black"
    //context.setTransform(1, 0, 0, 1, 0, 0)
    //context.font(1)
    //context.textAlign("left")
    //context.textBaseline("bottom")
    context.fillText(t.toString(), x, -y)
    context.restore()
    Evaluator.updateBoundingBox(x-10, y-10)
    Evaluator.updateBoundingBox(x + length, y + h+10)
  }

  /**
   * Display text inside a box with a given width
   * @param x position of the top left corner of the box
   * @param y position of the top left corner of the box
   * @param w the width of the text box
   * @param h text height
   * @param t string to display
   */
  override def textBox(x: Double, y: Double, w: Double, h: Double, t: Any): Unit = {
    val text = t.toString
    val correctedH = h / 1.5
    var newY = y
    val length = t.toString.length * 0.3 * h
    val lines = length/w
    var string = text.toList
    val chars = text.length
    val charsPerLine = (chars / lines).toInt
    Evaluator.updateBoundingBox(x + length/(length/w), y - h*length/w.ceil)
    Evaluator.updateBoundingBox(x,y + h)

    for (i <- 1 to lines.toInt + 2) {
      val myFont = correctedH.toString() + "px Arial"
      val str = string.take(charsPerLine) //make the string from the first elements
      string = string.takeRight(chars - charsPerLine * i) //pass the last elements to a new list
      context.font = myFont
      context.fillStyle = "black"
      context.fillText(str.mkString, x, newY)
      newY = newY + h
    }
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
    //TODO: rewrite this completely. Needs to use a TransformationMatrix and take into account the zoom level.
    val zoomScale = if(delta == -1) 1 + (delta * increment) else 1 + (delta * 0.1767) //zoom in needs to be bigger
    val mousePoint = Vector2D(pointX - windowCenter.x, pointY - windowCenter.y)
    context.translate(mousePoint.x, mousePoint.y)
    context.scale(zoomScale, zoomScale)
    context.translate(-mousePoint.x, -mousePoint.y)
  }

  /**
   * Sets the pan and zoom level to include the entire paper. Useful when a large import has occurred or similar.
   */
  def zoomExtends(centerX : Double, centerY : Double) {
    //zoom = math.max(View.width, View.height) / math.max(drawing.boundary.width, drawing.boundary.height) * 0.5 // 20% margin
    //val translateX = centerX * zoom
    //val translateY = centerY * zoom
  }
}
