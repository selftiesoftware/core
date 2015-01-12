package com.siigna.web

import scala.scalajs.js.JSConverters._
import scala.scalajs.js.Math

/**
 * Tools to transform splines to arcs in a 2-dimensional space
 */
object SplineToArc2D {

   var epsilon : Double = 0.00001  // Roughly 1/1000th of a degree, see below

  /**
   *  units: radians
   *  c = origin (x,y axis)
   *  r = radius
   *  spanning a1 to a2, where a2 - a1 < pi/2
   *
   *  Returns four points:
   *  x1,y1 and x4,y4 = endpoints
   *  x2,y2 and x3,y3 = control points.
   */

  def createSmallArc(r:Double, a1:Double, a2:Double) : List[Double] = {
    val a : Double = (a2 - a1) / 2.0 //

    var x4 : Double = r * Math.cos(a)
    var y4 : Double = r * Math.sin(a)
    var x1 : Double = x4
    var y1 : Double = -y4

    val k : Double = 0.5522847498
    val f : Double = k * Math.tan(a)

    var x2 : Double = x1 + f * y4
    var y2 : Double = y1 + f * x4
    var x3 : Double = x2
    var y3 : Double = -y2

    // Find arc end points
    val ar : Double = a + a1
    val cos_ar : Double = Math.cos(ar)
    val sin_ar : Double = Math.sin(ar)

    x1 = r * Math.cos(a1)
    y1 = r * Math.sin(a1)

    // rotate control points by ar
    x2 = x2 * cos_ar - y2 * sin_ar
    y2 = x2 * sin_ar + y2 * cos_ar
    x3 = x3 * cos_ar - y3 * sin_ar
    y3 = x3 * sin_ar + y3 * cos_ar
    x4 = r * Math.cos(a2)
    y4 = r * Math.sin(a2)

    List(x1,y1,x2,y2,x3,y3,x4,y4)
  }

  /**
   *  Return aN array of objects that represent bezier curves which approximate the
   *  circular arc centered at the origin, from startAngle to endAngle (radians) with 
   *  the specified radius.
   *
   *  Each bezier curve is an object with four points, where x1,y1 and 
   *  x4,y4 are the arc's end points and x2,y2 and x3,y3 are the cubic bezier's 
   *  control points.
   */

  def createArc(radius : Double, startAngle : Double, endAngle : Double) : Array[Double] = {
      // normalize startAngle, endAngle to [-2PI, 2PI]
      var twoPI : Double = Math.PI * 2
      var startA = startAngle % twoPI
      var endA = endAngle % twoPI

      // Compute the sequence of arc curves, up to PI/2 at a time.  Total arc angle
      // is less than 2PI.

      var curves = List[Double]()
      val piOverTwo : Double = Math.PI / 2.0
      val sgn : Double = if (startA < endA) 1 else -1

      var a1 : Double = startAngle
      var totalAngle : Double = Math.min(twoPI, Math.abs(endAngle - startAngle))
      if ( totalAngle >= epsilon)
      {
        val a2 : Double = a1 + sgn * Math.min(totalAngle, piOverTwo)
        val smallArc = createSmallArc(radius, a1, a2)
        //add arc points to curve (replacing the old curves variable)
        curves = curves ++ smallArc
        totalAngle -= Math.abs(a2 - a1)
        a1 = a2
      }
      //return curves
      for (a <- curves) {
      }
      curves.toArray
    }
  }
