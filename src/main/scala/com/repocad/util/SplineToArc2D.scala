package com.repocad.util

object SplineToArc2D {

    def arcToBezier(cX: Double, cY: Double, radius: Double, startAngleLarge: Double, endAngleLarge: Double) : List[List[Double]] = {

      def createSmallArc(startA : Double, endA : Double) : List[Double] = {

        val span = endA - startA

        // Bezier curve
        val x0 = math.cos(span / 2.0)
        val y0 = math.sin(span / 2.0)
        val x3 = x0
        val y3 = 0 - y0
        val x1 = (4.0 - x0) / 3.0
        val y1 = ((1.0 - x0) * (3.0 - x0)) / (3.0 * y0)
        val x2 = x1
        val y2 = 0 - y1

        //rotate the curve
        val bezAng = startA + span / 2.0
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

        val l = List(px0 + cX, py0 + cY, px1 + cX, py1 + cY, px2 + cX, py2 + cY, px3 + cX, py3 + cY)

        l
      }

      def createArc(radius : Double, startAngle : Double, endAngle : Double) : List[List[Double]] = {

        var arcs = List[List[Double]]() //placeholder for bezier curves to return

        // normalize startAngle, endAngle to [-2PI, 2PI]

        val twoPI : Double = 3.14 * 2
        val startA = startAngle % twoPI
        val endA = endAngle % twoPI

        // Compute the sequence of arc curves, up to PI/2 at a time.  Total arc angle
        // is less than 2PI.

        val curves = Array[Double]()
        val piOverTwo : Double = 3.14 / 2.0
        val sgn : Double = if (startA < endA) 1 else -1

        var a1 : Double = startAngle
        var totalAngle : Double = math.min(twoPI, math.abs(endAngle - startAngle))

        val segments = (totalAngle % 3.14).toInt

        for (i <- 0 to segments + 1) {
          if(totalAngle > epsilon) {
            val a2: Double = a1 + sgn * math.min(totalAngle, piOverTwo)
            val smallArc = createSmallArc(a1, a2)
            arcs = arcs :+ smallArc
            totalAngle -= math.abs(a2 - a1)
            a1 = a2
          }
        }
        arcs
      }
      //run - will return one or two bezier curves depending on the arc span (two if the span is more than 180 degrees)
      createArc(radius,startAngleLarge,endAngleLarge)
    }
  }