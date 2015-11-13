package com.repocad.web

import com.repocad.reposcript.Printer
import com.repocad.util.{SplineToArc2D, Vector2D, Portrait, Paper}
import SplineToArc2D.arcToBezier

import scala.scalajs.js
import scala.scalajs.js.JSConverters._
/**
 * A printer that can generate pdf files
 */
class PdfPrinter(paper : Paper) extends Printer[Any] {

  val context = js.Dynamic.global.jsPDF(paper.orientation.toString)

  // NOTE: Y is flipped
  val scaledCenter = Vector2D(paper.center.x, -paper.center.y)

  //set standard line weight
  context.setLineWidth(0.1)


  /**
   * create an arc.
   * @param x The x-coordinate of the center of the arc
   * @param y y	The y-coordinate of the center of the arc
   * @param r r	The radius of the arc
   * @param sAngle	The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
   * @param eAngle	The ending angle, in radians
   */
  def arc(x: Double,y: Double,r: Double,sAngle: Double,eAngle: Double) : Unit = {

    val splines = arcToBezier(x, y, r, sAngle, eAngle)

    //iterate through the list of arcs ad add them to the PDF
    splines.foreach(spline => {
      val x1 = spline(0)
      val y1 = spline(1)
      val x2 = spline(2)
      val y2 = spline(3)
      val x3 = spline(4)
      val y3 = spline(5)
      val x4 = spline(6)
      val y4 = spline(7)

      val v1 = transform(Vector2D(x1 / paper.scale, y1 / paper.scale))
      val v2 = transform(Vector2D(x2 / paper.scale, y2 / paper.scale))
      val v3 = transform(Vector2D(x3 / paper.scale, y3 / paper.scale))
      val v4 = transform(Vector2D(x4 / paper.scale, y4 / paper.scale)) //endPoint
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
  def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    val v1 = transform(Vector2D(x1 / paper.scale, y1 / paper.scale))
    val v2 = transform(Vector2D(x2 / paper.scale, y2 / paper.scale))
    val v3 = transform(Vector2D(x3 / paper.scale, y3 / paper.scale))
    val v4 = transform(Vector2D(x4 / paper.scale, y4 / paper.scale))//endPoint
    val x = v1.x
    val y = v1.y

    //SYNTAX: doc.lines([[crtlPt1x,crtlPt1y,crtlPt2x,crtlPt2y,endX,endY]], startX, startY, [scaleX,scaleY]);
    //coordinates are relative, so the start point x and y needs to be subtracted
    val six = Array(v2.x - x,v2.y - y,v3.x - x,v3.y - y,v4.x - x, v4.y - y).toJSArray     //two control points and end point:
    val scaleCurve = Array(1,1).toJSArray //scale x/y
    //create the bezier curve
    context.lines(Array(six).toJSArray,v1.x,v1.y,scaleCurve)
  }

  def circle(x : Double, y : Double, r : Double) : Unit = {
    val v = transform(Vector2D(x / paper.scale, y / paper.scale))
    context.circle(v.x,v.y,r / paper.scale)
  }

  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double) : Unit = {
    val v1 = transform(Vector2D(x1 / paper.scale, y1 / paper.scale))
    val v2 = transform(Vector2D(x2 / paper.scale, y2 / paper.scale))
    context.setLineWidth(0.1)
    context.line(v1.x, v1.y, v2.x, v2.y)
  }

  /**
   * Prepares the printer for drawing
   */
  def prepare() : Unit = {
  }

  def text(x : Double, y : Double, h : Double, t : Any) : Unit = {
    val v = transform(Vector2D(x, y))
    //document.setFont("times")
    context.setFontSize(h * 1.8)
    //document("test")
    context.text(v.x / paper.scale, v.y / paper.scale, t.toString)
  }

  private def transform(v : Vector2D): Vector2D = {
    if (paper.orientation == Portrait) {
      Vector2D(v.x,-v.y) - scaledCenter / paper.scale + Vector2D(105, 148.5)
    } else {
      Vector2D(v.x,-v.y) - scaledCenter / paper.scale + Vector2D(148.5, 105)
    }
  }

  def save(name : String): Unit = {
    context.save(name)
  }

  def drawPaper(): Unit = Unit

  def drawHeader(x : Int, y : Int): Unit = {
    context.setFontSize(11)
    context.text(x, y, "1:"+paper.scale)
    context.setFontSize(8)
    context.text(x, y+6, "www.repocad.com")

  }

  //draw paper header
  if(paper.orientation == Portrait) {
    drawHeader(170,280)
  } else drawHeader(260,195)

}
