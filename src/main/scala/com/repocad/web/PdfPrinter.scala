package com.repocad.web

import com.repocad.printer.Printer
import com.repocad.util.SplineToArc2D.arcToBezier
import com.repocad.util.{Paper, Portrait, Rectangle2D, Vector2D}

import scala.scalajs.js
import scala.scalajs.js.JSConverters._

/**
  * A printer that can generate pdf files
  */
class PdfPrinter(val paper: Paper) extends Printer[Any] {

  val context = js.Dynamic.global.jsPDF(paper.orientation.toString)

  override def boundary: Rectangle2D = paper.toRectangle

  // NOTE: Y is flipped
  val scaledCenter = Vector2D(paper.center.x, -paper.center.y)

  try {
    //set standard line weight
    context.setLineWidth(0.1)
    //draw paper header
    if (paper.orientation == Portrait) {
      drawHeader(170, 280)
    } else drawHeader(260, 195)
  } catch {
    case e: Exception =>
      println(e)
  }

  /**
    * create an arc.
    *
    * @param x      The x-coordinate of the center of the arc
    * @param y      y	The y-coordinate of the center of the arc
    * @param r      r	The radius of the arc
    * @param sAngle The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
    * @param eAngle The ending angle, in radians
    */
  def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {

    val splines = arcToBezier(x, y, r, sAngle, eAngle)

    //iterate through the list of arcs ad add them to the PDF
    splines.foreach(spline => {
      val x1 = spline.head
      val y1 = spline(1)
      val x2 = spline(2)
      val y2 = spline(3)
      val x3 = spline(4)
      val y3 = spline(5)
      val x4 = spline(6)
      val y4 = spline(7)

      val v1 = transform(Vector2D(x1 / scale.value, y1 / scale.value))
      val v2 = transform(Vector2D(x2 / scale.value, y2 / scale.value))
      val v3 = transform(Vector2D(x3 / scale.value, y3 / scale.value))
      val v4 = transform(Vector2D(x4 / scale.value, y4 / scale.value)) //endPoint
      val xS = v1.x
      val yS = v1.y

      //SYNTAX: doc.lines([[crtlPt1x,crtlPt1y,crtlPt2x,crtlPt2y,endX,endY]], startX, startY, [scaleX,scaleY]);
      //coordinates are relative, so the start point x and y needs to be subtracted
      val aX = v2.x - xS
      val aY = v2.y - yS
      val bX = v3.x - xS
      val bY = v3.y - yS
      val cX = v4.x - xS
      val cY = v4.y - yS

      val six = Array(aX, aY, bX, bY, cX, cY).toJSArray //two control points and end point:
      val scaleCurve = Array(1, 1).toJSArray //scale x/y
      //create the bezier curve
      context.lines(Array(six).toJSArray, v1.x, v1.y, scaleCurve)
    })
  }

  //TODO: unable to get the output format right.. some constellation of Array[Double]'s ??
  def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {
    val v1 = transform(Vector2D(x1 / scale.value, y1 / scale.value))
    val v2 = transform(Vector2D(x2 / scale.value, y2 / scale.value))
    val v3 = transform(Vector2D(x3 / scale.value, y3 / scale.value))
    val v4 = transform(Vector2D(x4 / scale.value, y4 / scale.value)) //endPoint
    val x = v1.x
    val y = v1.y

    //SYNTAX: doc.lines([[crtlPt1x,crtlPt1y,crtlPt2x,crtlPt2y,endX,endY]], startX, startY, [scaleX,scaleY]);
    //coordinates are relative, so the start point x and y needs to be subtracted
    val six = Array(v2.x - x, v2.y - y, v3.x - x, v3.y - y, v4.x - x, v4.y - y).toJSArray //two control points and end point:
    val scaleCurve = Array(1, 1).toJSArray //scale x/y
    //create the bezier curve
    context.lines(Array(six).toJSArray, v1.x, v1.y, scaleCurve)
  }

  def circle(x: Double, y: Double, r: Double): Unit = {
    val v = transform(Vector2D(x / scale.value, y / scale.value))
    context.circle(v.x, v.y, r / scale.value)
  }

  def drawPaper(): Unit = {}

  def drawHeader(x: Int, y: Int): Unit = {
    context.setFontSize(11)
    context.text(x, y, "1:" + scale.value)
    context.setFontSize(8)
    context.text(x, y + 6, "www.repocad.com")
  }

  def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    try {
      val v1 = transform(Vector2D(x1 / scale.value, y1 / scale.value))
      val v2 = transform(Vector2D(x2 / scale.value, y2 / scale.value))
      context.setLineWidth(0.1)
      context.line(v1.x, v1.y, v2.x, v2.y)
    } catch {
      case e: Exception => println(e)
    }
  }

  def save(name: String): Unit = {
    try {
      val x = context.save(name)
    } catch {
      case e: Exception =>
        println(e)
    }
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Map[String, Any] = {
    text(x, y, h, t, "Helvetica")
  }

  override def text(x: Double, y: Double, h: Double, t: Any, font: String): Map[String, Any] = {
    try {
      val v = transform(Vector2D(x / scale.value, y / scale.value))
      val fontSize = h * 1.8 / scale.value

      // Todo: This doesn't work
      //      context.setFont(font)
      context.setFontSize(fontSize)
      context.text(v.x, v.y, t.toString)
      val dimensions = context.getTextDimensions(t.toString)
      Map("x" -> dimensions.w.asInstanceOf[Double], "y" -> dimensions.h.asInstanceOf[Double])
    } catch {
      case e: Exception =>
        println(e)
        Map("x" -> 0, "y" -> 0)
    }
  }

  private def transform(v: Vector2D): Vector2D = {
    if (paper.orientation == Portrait) {
      Vector2D(v.x, -v.y) - scaledCenter / scale.value + Vector2D(105, 148.5)
    } else {
      Vector2D(v.x, -v.y) - scaledCenter / scale.value + Vector2D(148.5, 105)
    }
  }

}
