package com.repocad.util

/**
  * A bounding box that starts in (0, 0) and can expand when coordinates are added.
  */
case class BoundingBox(xRange: DynamicRange, yRange: DynamicRange) {

  def add(x: Double, y: Double): BoundingBox = {
    copy(xRange.add(x), yRange.add(y))
  }

  def addX(x: Double): BoundingBox = {
    copy(xRange = xRange.add(x))
  }

  def addY(y: Double): BoundingBox = {
    copy(yRange = yRange.add(y))
  }

  def toPaper: PaperA = Paper(xRange.min, yRange.min, xRange.max, yRange.max)

  override def toString = s"X[${xRange.min}, ${xRange.max}}] Y: [${yRange.min}, ${yRange.max}}]"

}

object BoundingBox {
  val empty = new BoundingBox(EmptyRange, EmptyRange)
}

trait DynamicRange {
  def add(number: Double): DynamicRange

  def max: Double

  def min: Double
}

case object EmptyRange extends DynamicRange {
  def add(number: Double) = NonEmptyRange(number, number)

  def max = 0

  def min = 0
}

case class NonEmptyRange(min: Double, max: Double) extends DynamicRange {
  def add(number: Double): NonEmptyRange = {
    if (number < min) {
      NonEmptyRange(number, max)
    } else if (number > max) {
      NonEmptyRange(min, number)
    } else {
      this
    }
  }
}