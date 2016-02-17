package com.repocad.web

import com.repocad.reposcript.Printer
import com.repocad.util.{TransformationMatrix, Vector2D, Paper, BoundingBox}
import org.scalajs.dom.raw.HTMLCanvasElement
import org.scalajs.dom.{CanvasRenderingContext2D => Canvas}

/**
 * A printer that renders to a HTML5 canvas
 * @param canvas  The HTML canvas element
 */
class CanvasPrinter(canvas : HTMLCanvasElement) extends Printer[Canvas] {

  val context : Canvas = canvas.getContext("2d").asInstanceOf[Canvas]

  private val zoomFactor = 1.15
  private var transformation = TransformationMatrix(1,0,0,1,-80,90)

  private var paper = Paper(0, 0, 0, 0)
  private var boundingBox = new BoundingBox

  //First run...
  def init(): Unit = {
    transform(_.translate(canvasCenter.x, canvasCenter.y))
    prepare()
    zoomExtends()
  }

  def canvasCenter = Vector2D(canvas.width / 2, canvas.height / 2)
  def windowCenter = Vector2D(canvas.getBoundingClientRect().left, canvas.getBoundingClientRect().top) + canvasCenter

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
    //drawCanvasIcons()
  }

  //draw an icon for zoom extends
  def drawCanvasIcons(): Unit = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    screenLine(5,20,20,5)
    screenLine(9,20,5,20)
    screenLine(5,15,5,20)
    screenLine(16,5,20,5)
    screenLine(20,10,20,5)
    context.restore()
  }

  def drawScreenText(): Unit = {
    //annotation
    val txt : String = "p a p e r : A 4       s c a l e:   1 :  " + paper.scale
    val version : String = "v e r.   0 . 2 "
    screenText(35,10,70,txt)
    screenText(370,10,70,version)
  }

  def screenLine(x1 : Double , y1  : Double, x2 : Double ,y2 : Double ) = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.lineWidth = 0.4
    context.closePath()
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

  /**
   * Display a custom text on a given position on the screen, Used for development and debugging purposes
   * @param x position on the x axis
   * @param y position on the y axis
   * @param t string to display
   */
  def textDot(x: Double, y: Double, t : String) = {
    val myFont : String = 30.toString + "px Arial"
    addAction(context => {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.beginPath()
      context.moveTo(x-20, y-20)
      context.lineTo(x+20, y+20)
      context.stroke()
      context.lineWidth = 0.4
      context.closePath()
      //context.beginPath()
      //context.moveTo(x-20, y+20)
      //context.lineTo(x+20, y-20)
      //context.stroke()
      //context.lineWidth = 0.4
      //context.closePath()
      //context.restore()
      //context.save()
      //context.setTransform(1, 0, 0, 1, 0, 0)
      //context.fillStyle = "Black"
      //context.fillRect(x, -y, 200, 200)
      //context.restore()
      //context.font = myFont
      //context.fillText(t, x, -y)
      context.restore()
    })
  }

  def translate(x : Double, y : Double) : Unit = {
    val zoom = transformation.scale
    transform(_.translate(x / zoom, y / zoom))
  }

  /**
   * Carries out a zoom action by zooming with the given delta and then panning
   * the printer relative to the current zoom-factor.
   *
   * @param delta  The current zoom delta (1 or -1) as received from the mouse wheel / touch pad via js
   * @param pointX  The center X for the zoom-operation
   * @param pointY  The center Y for the zoom-operation
   */
  def zoom(delta : Double, pointX : Double, pointY : Double) {
    val screenPoint = Vector2D(pointX, pointY) - windowCenter + canvasCenter
    val translation = transformation.inverse.applyToPoint(screenPoint.x, screenPoint.y)
    transform(_.translate(translation.x, translation.y))
    transform(_.scale(delta))
    transform(_.translate(-translation.x, -translation.y))

  }

  /**
   * Sets the pan and zoom level to include the entire paper. Useful when after large import or panned out of view.
   */
  def zoomExtends() {
    val t = -transformation.translation + canvasCenter
    val pC = paper.center
    transform(_.scale(1 / transformation.scale))
    transform(_.translate(t.x,t.y))
    transform(_.scale(1.0 / paper.scale))
    transform(_.translate(-pC.x, pC.y))
  }

  def transform(f : TransformationMatrix => TransformationMatrix): Unit = {
    this.transformation = f(transformation)
    context.setTransform(transformation.a, transformation.b, transformation.c,
                         transformation.d, transformation.e, transformation.f)
  }
}
