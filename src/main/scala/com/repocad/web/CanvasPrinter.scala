package com.repocad.web

import com.repocad.reposcript.Printer
import com.repocad.util.{Vector2D, Paper, BoundingBox}
import org.scalajs.dom.raw.HTMLCanvasElement
import org.scalajs.dom.{CanvasRenderingContext2D => Canvas}

/**
 * A printer that renders to a HTML5 canvas
 * @param canvas  The HTML canvas element
 */
class CanvasPrinter(canvas : HTMLCanvasElement) extends Printer[Canvas] {

  val context : Canvas = canvas.getContext("2d").asInstanceOf[Canvas]

  private var paper = Paper(0, 0, 0, 0)
  private var boundingBox = new BoundingBox

  //First run...
  def init(): Unit = {
    context.translate(canvas.width / 2, canvas.height / 2)
    context.scale(1, 1)
    prepare()
  }

  //window center
  def windowCenter = Vector2D((canvas.getBoundingClientRect().right + canvas.getBoundingClientRect().left) * 0.5,
    (canvas.getBoundingClientRect().bottom + canvas.getBoundingClientRect().top) * 0.5)

  /**
   * Draw a white rectangle representing the drawing if it is printed
   */
  def drawPaper() = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = "AliceBlue"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()

    context.fillStyle = "white"
    paper = boundingBox.toPaper

    context.fillRect(paper.minX, -paper.maxY, paper.width, paper.height)

    drawScreenText()
  }

  def drawScreenText(): Unit = {
    //annotation
    val txt : String = "p a p e r : A 4       s c a l e:   1 :  " + paper.scale
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
    val myFont = 10.toString + "pt Arial"

    addAction(context => {
      context.font = myFont
      //context.font(1)
      //context.textAlign("left")
      //context.textBaseline("bottom")
      context.fillText(t.toString, x, -y)
    })
  }

  override def arc(x: Double, y: Double, r: Double, sAngle : Double, eAngle : Double): Unit = {
    boundingBox.add(x + r, y + r)
    boundingBox.add(x - r, y - r)

    addAction(context => {
      context.beginPath()
      context.arc(x, -y, r, sAngle, eAngle)
      context.stroke()
      context.lineWidth = 0.2 * paper.scale
      context.closePath()

    })
  }

  override def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    boundingBox.add(x1, y1)
    boundingBox.add(x2, y2)
    boundingBox.add(x3, y3)
    boundingBox.add(x4, y4)

    addAction(context => {
      context.beginPath()
      context.moveTo(x1, -y1)
      context.bezierCurveTo(x2, -y2, x3, -y3, x4, -y4)
      context.stroke()
      context.lineWidth = 0.2 * paper.scale
    })
  }

  def getPaper = paper

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    boundingBox.add(x1,y1)
    boundingBox.add(x2,y2)

    addAction(context => {
      context.beginPath()
      context.moveTo(x1, -y1)
      context.lineTo(x2, -y2)
      context.stroke()
      context.lineWidth = 0.2 * paper.scale
      context.closePath()
    })
  }

  override def circle(x: Double, y: Double, r: Double): Unit = {
    boundingBox.add(x + r, y + r)
    boundingBox.add(x - r, y - r)

    addAction(context => {
      context.beginPath()
      context.arc(x, -y, r, 0, 2 * Math.PI)
      context.lineWidth = 0.2 * paper.scale
      context.stroke()
      context.closePath()
    })
  }

  /**
   * Prepares the printer for drawing
   */
  def prepare() : Unit = {
    actions = Seq()
    boundingBox = new BoundingBox
  }

  def screenText (x: Double, y: Double, size: Double, t: Any): Unit = {
    context.font = size.toString + " pt Arial"
    context.fillStyle = "black"
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillText(t.toString, x, y)
    context.restore()
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Unit = {
    val length = t.toString.length * 0.3 * h
    val correctedH = h / 1.5
    val myFont : String = correctedH + "px Arial"

    boundingBox.add(x - 10, y - 10)
    boundingBox.add(x + length, y + h + 10)

    addAction(context => {
      context.save()
      context.font = myFont
      context.fillStyle = "black"
      //context.setTransform(1, 0, 0, 1, 0, 0)
      //context.font(1)
      //context.textAlign("left")
      //context.textBaseline("bottom")
      context.fillText(t.toString, x, -y)
      context.restore()
    })
  }

  def translate(x : Double, y : Double) : Unit = {
    context.translate(x, y)
  }

  /**
   * Carries out a zoom action by zooming with the given delta and then panning
   * the printer relative to the current zoom-factor.
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
