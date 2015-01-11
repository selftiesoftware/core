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

package com.siigna.web

/**
 * Collection of methods to achieve better circular arc drawing, as
 */
object ArcTools {

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

}
