package com.repocad.util

/**
 * A bounding box that starts in (0, 0) and can expand when coordinates are added.
 */
class BoundingBox {

  private var xRange : DynamicRange = EmptyRange
  private var yRange : DynamicRange = EmptyRange

  def add(x : Double, y : Double) = {
    xRange = xRange.add(x)
    yRange = yRange.add(y)
  }

  def addX(x : Double): Unit = {
    xRange = xRange.add(x)
  }

  def addY(y : Double): Unit = {
    yRange = yRange.add(y)
  }

  def toPaper : Paper = Paper(xRange.min, yRange.min, xRange.max, yRange.max)

}

trait DynamicRange {
  def add(number : Double) : DynamicRange
  def center : Double
  def max : Double
  def min : Double
}

case object EmptyRange extends DynamicRange {
  def add(number : Double) = NonEmptyRange(number, number)
  def center = 0
  def max = 0
  def min = 0
}

case class NonEmptyRange(min : Double, max : Double) extends DynamicRange {
  def add(number : Double): NonEmptyRange = {
    if (number < min) {
      NonEmptyRange(number, max)
    } else if (number > max) {
      NonEmptyRange(min, max)
    } else {
      this
    }
  }
  def center = (min + max) / 2
}