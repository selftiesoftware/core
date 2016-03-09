package com.repocad.web

import com.repocad.util._
import org.scalajs.dom.raw.HTMLCanvasElement
import org.scalajs.dom.{CanvasRenderingContext2D => Canvas}

/**
  * A printer that renders to a HTML5 canvas
  */
class CanvasPrinter(canvas: HTMLCanvasElement) extends Printer[Canvas, Paper] {

  protected var _transformation = TransformationMatrix(1, 0, 0, 1, 0, 0)
  protected var boundingBox = BoundingBox.empty

  val context = canvas.getContext("2d").asInstanceOf[Canvas]
  var paper: Paper = Paper(0, 0, 0, 0)

  def height = canvas.height

  def width = canvas.width

  def canvasCenter = Vector2D(width / 2, height / 2)

  def paperCenter: Vector2D = {
    canvasCenter + boundingBox.toPaper.center
  }

  def transformation: TransformationMatrix = _transformation

  // Initialise the transformation
  transform(_.translate(canvasCenter.x, canvasCenter.y))

  /**
    * Draw a white rectangle representing the drawing if it is printed
    */
  def drawPaper() = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = "AliceBlue"
    context.fillRect(0, 0, width, height)
    context.restore()
    context.fillStyle = "white"

    paper match {
      case a4: PaperA =>
        val paper = boundingBox.toPaper
        context.fillRect(paper.minX, -paper.maxY, paper.width, paper.height)
        context.beginPath()
        context.strokeStyle = "#AAA"
        context.strokeRect(paper.minX, -paper.maxY, paper.width, paper.height)
        context.strokeStyle = "#222"
        this.paper = paper
      case _ =>
    }
    drawScreenText()
    //drawCanvasIcons()
  }

  //draw an icon for zoom extends
  def drawCanvasIcons(): Unit = {
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    screenLine(5, 20, 20, 5)
    screenLine(9, 20, 5, 20)
    screenLine(5, 15, 5, 20)
    screenLine(16, 5, 20, 5)
    screenLine(20, 10, 20, 5)
    context.restore()
  }

  def drawScreenText(): Unit = {
    //annotation
    val txt: String = "p a p e r : A 4       " + (
      if (!paper.isBoundless) "s c a l e:   1 :  " + paper.scale else ""
    )
    val versionNumber = Repocad.version.toString.foldLeft("")((string: String, char) => string + char + " ")
    val version: String = "v e r.  " + versionNumber
    screenText(35, 10, 10, txt)
    screenText(370, 10, 10, version)
  }

  def screenLine(x1: Double, y1: Double, x2: Double, y2: Double) = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.lineWidth = 0.4
    context.closePath()
  }

  override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {
    boundingBox = boundingBox.add(x + r, y + r)
    boundingBox = boundingBox.add(x - r, y - r)

    addAction(context => {
      context.beginPath()
      context.arc(x, -y, r, sAngle, eAngle)
      context.stroke()
      context.lineWidth = 0.2 * paper.scale
      context.closePath()
    })
  }

  override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {
    boundingBox = boundingBox.add(x1, y1)
    boundingBox = boundingBox.add(x2, y2)
    boundingBox = boundingBox.add(x3, y3)
    boundingBox = boundingBox.add(x4, y4)

    addAction(context => {
      context.beginPath()
      context.moveTo(x1, -y1)
      context.bezierCurveTo(x2, -y2, x3, -y3, x4, -y4)
      context.stroke()
      context.lineWidth = 0.2 * paper.scale
    })
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    boundingBox = boundingBox.add(x1, y1)
    boundingBox = boundingBox.add(x2, y2)

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
    boundingBox = boundingBox.add(x + r, y + r)
    boundingBox = boundingBox.add(x - r, y - r)

    addAction(context => {
      context.beginPath()
      context.arc(x, -y, r, 0, 2 * Math.PI)
      context.lineWidth = 0.2 * paper.scale
      context.stroke()
      context.closePath()
    })
  }

  override def prepare(): Unit = {
    super.prepare()
    boundingBox = BoundingBox.empty
  }

  def screenText(x: Double, y: Double, size: Double, t: Any): Unit = {
    context.font = size.toString + "px Arial"
    context.fillStyle = "black"
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillText(t.toString, x, y)
    context.restore()
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Map[String, Any] = {
    text(x, y, h, t, "Arial")
  }

  override def text(x: Double, y: Double, height: Double, t: Any, font: String): Map[String, Any] = {
    val myFont: String = height + "px " + font
    context.font = myFont
    val width = context.measureText(t.toString).width

    boundingBox = boundingBox.add(x, y)
    boundingBox = boundingBox.add(x + width, y + height)

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

    Map("x" -> width, "y" -> height)
  }

  def translate(x: Double, y: Double): Unit = {
    val zoom = _transformation.scale
    transform(_.translate(x / zoom, y / zoom))
  }

  /**
    * Carries out a zoom action by zooming with the given delta and then panning
    * the printer relative to the current zoom-factor.
    *
    * @param delta    The current zoom delta (1 or -1) as received from the mouse wheel / touch pad via js
    * @param position The center for the zoom-operation
    */
  def zoom(delta: Double, position: Vector2D) {
    val screenPoint = position + canvasCenter
    val translation = _transformation.inverse.applyToPoint(screenPoint.x, screenPoint.y)
    transform(_.translate(translation.x, translation.y))
    transform(_.scale(delta))
    transform(_.translate(-translation.x, -translation.y))
  }

  /**
    * Sets the pan and zoom level to include the entire paper. Useful when after large import or panned out of view.
    */
  def zoomExtends() {
    val t = -_transformation.translation + canvasCenter
    val pC = boundingBox.toPaper.center
    transform(_.scale(1 / _transformation.scale))
    transform(_.translate(t.x, t.y))
    transform(_.scale(1.0 / paper.scale))
    transform(_.translate(-pC.x, pC.y))
  }

  def transform(f: TransformationMatrix => TransformationMatrix): Unit = {
    this._transformation = f(_transformation)
    context.setTransform(_transformation.a, _transformation.b, _transformation.c,
      _transformation.d, _transformation.e, _transformation.f)
  }
}
