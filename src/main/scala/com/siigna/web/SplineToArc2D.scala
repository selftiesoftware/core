package com.siigna.web

  object SplineToArc2D {

    def arcToBezier(cX: Double, cY: Double, radius: Double, startAngle: Double, endAngle: Double) : List[Double] =
    {

      val span = endAngle - startAngle

      // Bezier curve
      val x0 = math.cos(span / 2.0)
      val y0 = math.sin(span / 2.0)
      val x3 = x0
      val y3 = 0 - y0
      val x1 = (4.0 - x0) / 3.0
      val y1 = ((1.0 - x0) * (3.0 - x0)) / (3.0 * y0) // y0 != 0...
      val x2 = x1
      val y2 = 0 - y1

      //rotate the curve
      val bezAng = startAngle + span / 2.0
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

      //scale and flip Y
      val px0 = radius * rx0
      val py0 = radius * -ry0
      val px1 = radius * rx1
      val py1 = radius * -ry1
      val px2 = radius * rx2
      val py2 = radius * -ry2
      val px3 = radius * rx3
      val py3 = radius * -ry3

      //move to cX,cY

      //return:
      //List(px0, py0, px1, py1, px2, py2, px3, py3)
      List(px0 + cX, py0 + cY, px1 + cX, py1 + cY, px2+ cX, py2 + cY, px3+ cX, py3 + cY)
    }
  }