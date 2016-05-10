package com.repocad.util

object Rectangle2D {

  def apply(v1: Vector2D, v2: Vector2D): Rectangle2D = {
    new Rectangle2D(math.min(v1.x, v2.x), math.min(v1.y, v2.y), math.max(v1.x, v2.x), math.max(v1.y, v2.y))
  }

}

/**
  * A simple rectangle given by two points.
  *
  * @param xMin The least x-value
  * @param yMin The least y-value
  * @param xMax The largest x-value
  * @param yMax The largest y-value
  */
case class Rectangle2D(xMin: Double, yMin: Double, xMax: Double, yMax: Double) {

  def -(point: Vector2D) = new Rectangle2D(xMin - point.x, yMin - point.y, xMax - point.x, yMax - point.y)

  def +(point: Vector2D) = new Rectangle2D(xMin + point.x, yMin + point.y, xMax + point.x, yMax + point.y)

  def *(point: Vector2D) = new Rectangle2D(xMin * point.x, yMin * point.y, xMax * point.x, yMax * point.y)

  def /(point: Vector2D) = new Rectangle2D(xMin / point.x, yMin / point.y, xMax / point.x, yMax / point.y)

  /**
    * The lowest left corner of the rectangle.
    */
  def bottomLeft = Vector2D(xMin, yMin)

  /**
    * The lowest right corner of the rectangle.
    */
  def bottomRight = Vector2D(xMax, yMin)

  def boundary = this

  /**
    * The upper left corner of the rectangle.
    */
  def topLeft = Vector2D(xMin, yMax)

  /**
    * The upper right corner of the rectangle.
    */
  def topRight = Vector2D(xMax, yMax)

  /**
    * The center of the rectangle.
    */
  val center = (topLeft + bottomRight) / 2

  def closestPoint(point: Vector2D) = point

  def contains(point: Vector2D): Boolean =
    bottomLeft.x <= point.x && point.x <= topRight.x &&
      bottomLeft.y <= point.y && point.y <= topRight.y

  def expand(that: Rectangle2D): Rectangle2D = Rectangle2D(
    math.min(that.xMin, xMin), math.min(that.yMin, yMin), math.max(that.xMax, xMax), math.max(that.yMax, yMax)
  )
  
  /**
    * Returns the height of the rectangle.
    */
  def height = (yMax - yMin).abs

  def onPeriphery(point: Vector2D) =
    (point.x == xMin || point.x == xMax) && (point.y == yMax || point.y == yMin)

  /**
    * Rounds the coordinates of the rectangle to the nearest whole numbers.
    *
    * @return A rectangle with its coordinates rounded.
    */
  def round = Rectangle2D(topLeft.round, bottomRight.round)

  lazy val vertices = Seq(topLeft, topRight, bottomRight, bottomLeft)

  def width = (xMax - xMin).abs

  def transform(t: TransformationMatrix) = {
    val p1 = topLeft.transform(t)
    val p2 = bottomRight.transform(t)

    Rectangle2D(p1.x, p1.y, p2.x, p2.y)
  }
}
