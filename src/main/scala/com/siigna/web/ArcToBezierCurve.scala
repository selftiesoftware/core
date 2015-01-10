package com.siigna.web

/**
 * Created by oep on 10-01-2015.
 */
object ArcTools {

  /**
   * ArcUtils.java
   *
   * Copyright (c) 2014 BioWink GmbH.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software. 
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   **/

  /**
   * Collection of methods to achieve better circular arc drawing, as
   * {@link Canvas#drawArc(android.graphics.RectF, float, float, boolean, android.graphics.Paint)} is unreliable.
   * <p>
   * To draw a simple arc, use
   * {@link #drawArc(android.graphics.Canvas, android.graphics.PointF, float, float, float, android.graphics.Paint)}.
   * </p>
   */
 
    val FULL_CIRCLE_RADIANS = 360d.toRadians

    /**
     * Normalize the input radians in the range 360° > x >= 0°
     *
     * @param radians The angle to normalize (in radians).
     *
     * @return The angle normalized in the range 360Â° > x >= 0Â°.
     */
    def normalizeRadians(radians : Double) : Double = {
      var newR = radians
      radians % FULL_CIRCLE_RADIANS
      if (radians < 0d) { newR += FULL_CIRCLE_RADIANS }
      if (radians == FULL_CIRCLE_RADIANS)
        newR = 0d
      radians
    }


    /**
     * Returns the point of a given angle (in radians) on a circle.
     *
     * @param centerX       The center X of the circle.
     * @param centerY       The center Y of the circle.
     * @param radius       The radius of the circle.
     * @param angleRadians The angle (in radians).
     *
     * @return The point of the given angle on the specified circle.
     *
     * @see #pointFromAngleDegrees(android.graphics.PointF, float, float)
     */
    def pointFromAngleRadians(centerX : Double, centerY : Double, radius : Double, angleRadians : Double) = {
      (centerX + radius * math.cos(angleRadians), centerY + radius * math.sin(angleRadians))
    }

    /**
     * Returns the point of a given angle (in degrees) on a circle.
     *
     * @param centerX       The center X of the circle.
     * @param centerY       The center Y of the circle.
     * @param radius       The radius of the circle.
     * @param angleDegrees The angle (in degrees).
     *
     * @return The point of the given angle on the specified circle.
     *
     * @see #pointFromAngleRadians(android.graphics.PointF, float, double)
     */

    def pointFromAngleDegrees(centerX : Double, centerY : Double, radius : Double, angleDegrees : Double)
      { pointFromAngleRadians(centerX, centerY, radius, angleDegrees.toRadians) }

    /**
     * Adds a circular arc to the given path by approximating it through a cubic BÃ©zier curve, splitting it if
     * necessary. The precision of the approximation can be adjusted through {@code pointsOnCircle} and
     * {@code overlapPoints} parameters.
     * <p>
     * <strong>Example:</strong> imagine an arc starting from 0Â° and sweeping 100Â° with a value of
     * {@code pointsOnCircle} equal to 12 (threshold -> 360Â° / 12 = 30Â°):
     * <ul>
     * <li>if {@code overlapPoints} is {@code true}, it will be split as following:
     * <ul>
     * <li>from 0Â° to 30Â° (sweep 30Â°)</li>
     * <li>from 30Â° to 60Â° (sweep 30Â°)</li>
     * <li>from 60Â° to 90Â° (sweep 30Â°)</li>
     * <li>from 90Â° to 100Â° (sweep 10Â°)</li>
     * </ul>
     * </li>
     * <li>if {@code overlapPoints} is {@code false}, it will be split into 4 equal arcs:
     * <ul>
     * <li>from 0Â° to 25Â° (sweep 25Â°)</li>
     * <li>from 25Â° to 50Â° (sweep 25Â°)</li>
     * <li>from 50Â° to 75Â° (sweep 25Â°)</li>
     * <li>from 75Â° to 100Â° (sweep 25Â°)</li>
     * </ul>
     * </li>
     * </ul>
     * </p>
     * <p/>
     * For a technical explanation:
     * <a href="http://hansmuller-flex.blogspot.de/2011/10/more-about-approximating-circular-arcs.html">
     * http://hansmuller-flex.blogspot.de/2011/10/more-about-approximating-circular-arcs.html
     * </a>
     *
     * @param centerX            The center of the circle.
     * @param centerY           The center of the circle.
     * @param radius            The radius of the circle.
     * @param startAngleRadians The starting angle on the circle (in radians).
     * @param sweepAngleRadians How long to make the total arc (in radians).
     * @param pointsOnCircle    Defines a <i>threshold</i> (360Â° /{@code pointsOnCircle}) to split the BÃ©zier arc to
     *                          better approximate a circular arc, depending also on the value of {@code overlapPoints}.
     *                          The suggested number to have a reasonable approximation of a circle is at least 4 (90Â°).
     *                          Less than 1 will be ignored (the arc will not be split).
     * @param overlapPoints     Given the <i>threshold</i> defined through {@code pointsOnCircle}:
     *                          <ul>
     *                          <li>if {@code true}, split the arc on every angle which is a multiple of the
     *                          <i>threshold</i> (yields better results if drawing precision is required,
     *                          especially when stacking multiple arcs, but can potentially use more points)</li>
     *                          <li>if {@code false}, split the arc equally so that each part is shorter than
     *                          the <i>threshold</i></li>
     *                          </ul>
     *
     * @return                  A list of doubles describing the bezier curve
     *
     * @see #createBezierArcDegrees(android.graphics.PointF, float, float, float, int, boolean, android.graphics.Path)
     */


    /*@NotNull
    def createBezierArcRadians(centerX : Double, centerY : Double, radius : Double, startAngleRadians : Double,
    sweepAngleRadians : Double, pointsOnCircle : Int, overlapPoints : Boolean) : List[Double] = {
      val path = List[Double]()
      if (sweepAngleRadians == 0d) { return path }

      if (pointsOnCircle >= 1)
      {
        val threshold = FULL_CIRCLE_RADIANS / pointsOnCircle
        if (sweepAngleRadians.abs > threshold)
        {
          val angle = normalizeRadians(startAngleRadians)
          val endPoints = pointFromAngleRadians(centerX,centerY, radius, angle)
          path.moveTo(start.x, start.y)
          if (overlapPoints)
          {
            final boolean cw = sweepAngleRadians > 0 // clockwise?
            final double angleEnd = angle + sweepAngleRadians
            while (true)
            {
              double next = (cw ? ceil(angle / threshold) : floor(angle / threshold)) * threshold
              if (angle == next) { next += threshold * (cw ? 1d : -1d) }
              final boolean isEnd = cw ? angleEnd <= next : angleEnd >= next
              end = pointFromAngleRadians(center, radius, isEnd ? angleEnd : next)
              addBezierArcToPath(path, center, start, end, false)
              if (isEnd) { break }
              angle = next
              start = end
            }
          }
          else
          {
            final int n = abs((int)ceil(sweepAngleRadians / threshold))
            final double sweep = sweepAngleRadians / n
            for (int i = 0
            i < n
            i++, start = end)
            {
              angle += sweep
              end = pointFromAngleRadians(center, radius, angle)
              addBezierArcToPath(path, center, start, end, false)
            }
          }
          return path
        }
      }

      final PointF start = pointFromAngleRadians(center, radius, startAngleRadians)
      final PointF end = pointFromAngleRadians(center, radius, startAngleRadians + sweepAngleRadians)
      addBezierArcToPath(path, center, start, end, true)
      return path
    }
    */
}
