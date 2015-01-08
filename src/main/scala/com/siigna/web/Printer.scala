package com.siigna.web

/**
 * A printer that can print objects on a medium
 */
trait Printer {

  /**
   * Draws an arc
   * @param x First coordinate
   * @param y Second coordinate
   * @param r Radius
   * @param sAngle start angle (3'o clock)
   * @param eAngle end angle
   *
   */

  def arc(x : Double, y : Double, r : Double, sAngle : Double, eAngle : Double)

  /**
   * Draws a bezier curve
   * @param x1 start x
   * @param y1 start y
   * @param x2 control point1 x
   * @param y2 control point1 y
   * @param x3 control point2 x
   * @param y3 control point2 y
   * @param x4 end x
   * @param y4 start y
   *
   */
  def bezierCurve(x1 : Double, y1 : Double, x2 : Double, y2 : Double, x3 : Double, y3 : Double, x4 : Double, y4 : Double)

  /**
   * Draws a circle
   * @param x First coordinate
   * @param y Second coordinate
   * @param r Radius
   */
  def circle(x : Double, y : Double, r : Double)

  /**
   * Renders a textual string
   * @param x First coordinate
   * @param y Second coordinate
   * @param h Height
   * @param t Text
   */
  def text(x : Double, y : Double, h : Double, t : Any)

  /**
   * Draws a line
   * @param x1 First coordinate
   * @param y1 Second coordinate
   * @param x2 Third coordinate
   * @param y2 Fourth coordinate
   */
  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double)

}