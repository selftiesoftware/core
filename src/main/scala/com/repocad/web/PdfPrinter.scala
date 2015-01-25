package com.repocad.web

import scala.scalajs.js
import scala.scalajs.js.JSConverters._
import SplineToArc2D.arcToBezier
/**
 * A printer that can generate pdf files
 */
class PdfPrinter() extends Printer {

  val landscape = Paper.scaleAndRotation() //update the paper scale and rotation so the correct values are used when generating the PDF
  var orientation : String = "landscape"
  if (!landscape) orientation = "portrait"
  val document = js.Dynamic.global.jsPDF(orientation.toString)
  val offsetX = com.repocad.web.drawingCenter.x
  val offsetY = com.repocad.web.drawingCenter.y

  //Transform by moving (0, 0) to center of paper NOTE: Y is flipped.
  var scaledCenter = Vector2D(drawingCenter.x / paperScale ,-drawingCenter.y / paperScale)

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

      val v1 = transform(Vector2D(x1 / paperScale, y1 / paperScale))
      val v2 = transform(Vector2D(x2 / paperScale, y2 / paperScale))
      val v3 = transform(Vector2D(x3 / paperScale, y3 / paperScale))
      val v4 = transform(Vector2D(x4 / paperScale, y4 / paperScale)) //endPoint
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
      document.lines(Array(six).toJSArray, v1.x, v1.y, scaleCurve)
    })
  }

  //TODO: unable to get the output format right.. some constellation of Array[Double]'s ??
  def bezierCurve(x1: Double,y1: Double,x2: Double,y2: Double,x3: Double,y3: Double,x4: Double,y4: Double) : Unit = {
    val v1 = transform(Vector2D(x1 / paperScale, y1 / paperScale))
    val v2 = transform(Vector2D(x2 / paperScale, y2 / paperScale))
    val v3 = transform(Vector2D(x3 / paperScale, y3 / paperScale))
    val v4 = transform(Vector2D(x4 / paperScale, y4 / paperScale))//endPoint
    val x = v1.x
    val y = v1.y

    //SYNTAX: doc.lines([[crtlPt1x,crtlPt1y,crtlPt2x,crtlPt2y,endX,endY]], startX, startY, [scaleX,scaleY]);
    //coordinates are relative, so the start point x and y needs to be subtracted
    val six = Array(v2.x - x,v2.y - y,v3.x - x,v3.y - y,v4.x - x, v4.y - y).toJSArray     //two control points and end point:
    val scaleCurve = Array(1,1).toJSArray //scale x/y
    //create the bezier curve
    document.lines(Array(six).toJSArray,v1.x,v1.y,scaleCurve)
  }

  def circle(x : Double, y : Double, r : Double) : Unit = {
    val v = transform(Vector2D(x, y))
    document.circle(v.x,v.y,r)
  }

  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double) : Unit = {
    val v1 = transform(Vector2D(x1 / paperScale, y1 / paperScale))
    val v2 = transform(Vector2D(x2 / paperScale, y2 / paperScale))
    document.setLineWidth(0.02)
    document.line(v1.x, v1.y, v2.x, v2.y)
  }

  def text(x : Double, y : Double, h : Double, t : Any) : Unit = {
    val v = transform(Vector2D(x, y))
    //document.setFont("times")
    document.setFontSize(h * 1.8)
    //document("test")
    document.text(v.x / paperScale,v.y / paperScale,t.toString)
  }

  def textBox(x : Double, y : Double, w: Double, h : Double, t : Any) : Unit = {
    val v = transform(Vector2D(x, y))
    document.setFontSize(h * 1.8)
    var newY = v.y
    val length = t.toString.length * 0.3 * h
    val lines = length/w

    for (i <- 0 to lines.toInt) {
      document.text(v.x / paperScale,newY / paperScale,t.toString)
      newY = newY + h
    }
  }

  private def transform(v : Vector2D): Vector2D = {
    if (!landscape) {
      val a = Vector2D(v.x,-v.y) - scaledCenter + Vector2D(paperSize(0)/2,paperSize(1)/2)
      a
    } else {
      val b = Vector2D(v.x,-v.y) - scaledCenter + Vector2D(paperSize(1)/2,paperSize(0)/2)
      b
    }
  }

  def save(name : String): Unit = {
    document.save(name)
  }

}
