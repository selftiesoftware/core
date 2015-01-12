package com.siigna.web
// Global variables: 
// The true coordinates of the Bezier control points:

  object SplineToArc2D {

    def arcToBezier(cX: Double, cY: Double, radius: Double, startAngle: Double, endAngle: Double) : List[Double] =
    {

      //expanded: http://www.flong.com/blog/2009/bezier-approximation-of-a-circular-arc-in-processing/

      // Establish arc parameters.
      // (Note: assert theta != TWO_PI)
      val theta: Double = endAngle - startAngle // spread of the arc.

      // Compute raw Bezier coordinates.
      val x0 = math.cos(theta / 2.0)
      val y0 = math.sin(theta / 2.0)
      val x3 = x0
      val y3 = 0 - y0
      val x1 = (4.0 - x0) / 3.0
      val y1 = ((1.0 - x0) * (3.0 - x0)) / (3.0 * y0) // y0 != 0...
      val x2 = x1
      val y2 = 0 - y1

      // Compute rotationally-offset Bezier coordinates, using:
      // x' = cos(angle) * x - sin(angle) * y
      // y' = sin(angle) * x + cos(angle) * y
      val bezAng = startAngle + theta / 2.0
      val cBezAng = math.cos(bezAng)
      val sBezAng = math.sin(bezAng)
      val rx0 = cBezAng * x0 - sBezAng * y0
      val ry0 = sBezAng * x0 + cBezAng * y0
      val rx1 = cBezAng * x1 - sBezAng * y1
      val ry1 = sBezAng * x1 + cBezAng * y1
      val rx2 = cBezAng * x2 - sBezAng * y2
      val ry2 = sBezAng * x2 + cBezAng * y2
      val rx3 = cBezAng * x3 - sBezAng * y3
      val ry3 = sBezAng * x3 + cBezAng * y3

      // Compute scaled and translated Bezier coordinates.
      val px0 = cX + radius * rx0
      val py0 = cY + radius * ry0
      val px1 = cX + radius * rx1
      val py1 = cY + radius * ry1
      val px2 = cX + radius * rx2
      val py2 = cY + radius * ry2
      val px3 = cX + radius * rx3
      val py3 = cY + radius * ry3

      //return:
      List(px0, py0, px1, py1, px2, py2, px3, py3)
    }
  }