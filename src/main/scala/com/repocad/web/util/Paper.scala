package com.repocad.web.util

import com.repocad.geom.{Rectangle2D, Vector2D}

object Paper {

  def apply(minX: Double, minY: Double, maxX: Double, maxY: Double): Paper = {
    val height = maxY - minY
    val width = maxX - minX

    val center = Vector2D((minX + maxX) / 2, (minY + maxY) / 2)
    val orientation = if (width < height) Portrait else Landscape

    new Paper(center, A4, orientation)
  }

  def apply(rectangle2D: Rectangle2D): Paper = {
    new Paper(rectangle2D.center, A4, if (rectangle2D.width < rectangle2D.height) Portrait else Landscape)
  }

}

/**
  * A paper is a representation of the extension of the paper in 2d euclidian space. It uses the ISO A
  * format ratio between width and height.
  *
  * @param center      The center of the paper.
  * @param format      The A format.
  * @param orientation Either landscape of portrait.
  */
case class Paper(center: Vector2D, format: AFormat = A4, orientation: PaperOrientation = Landscape) {

  val height: Double = orientation.getHeight(format)
  val width: Double = orientation.getWidth(format)

  val minX = center.x - width / 2
  val maxX = center.x + width / 2
  val minY = center.y - height / 2
  val maxY = center.y + height / 2

  def toRectangle = Rectangle2D(minX, minY, maxX, maxY)

}

object AFormat {

  def fromRectangle(rectangle2D: Rectangle2D): Option[AFormat] = {
    val larger = math.max(rectangle2D.width, rectangle2D.height)
    val smaller = math.min(rectangle2D.width, rectangle2D.height)
    if (larger <= A4.larger && smaller <= A4.smaller) {
      Some(A4)
    } else if (larger <= A3.larger && smaller <= A3.smaller) {
      Some(A3)
    } else if (larger <= A2.larger && smaller <= A2.smaller) {
      Some(A2)
    } else if (larger <= A1.larger && smaller <= A1.smaller) {
      Some(A1)
    } else if (larger <= A0.larger && smaller <= A0.smaller) {
      Some(A0)
    } else {
      None
    }
  }

}

/**
  * The paper size in A-format.
  */
trait AFormat {
  /**
    * The larger dimension in the A format.
    */
  val larger: Int

  /**
    * The smaller dimension in the A format.
    */
  val smaller: Int
}

case object A4 extends AFormat {
  override val larger: Int = 297
  override val smaller: Int = 210
}

case object A3 extends AFormat {
  override val larger = 420
  override val smaller = 297
}

case object A2 extends AFormat {
  override val larger: Int = 594
  override val smaller: Int = 420
}

case object A1 extends AFormat {
  override val larger: Int = 841
  override val smaller: Int = 594
}

case object A0 extends AFormat {
  override val larger: Int = 1189
  override val smaller: Int = 841
}

/**
  * In this domain a paper can be rotated as a portrait (where the width is larger than the height) a landscape
  * (where the height is larger than the width). Both follow the A-paper standard where the ratio is 297:210.
  */
trait PaperOrientation {

  def getHeight(size: AFormat): Int

  def getScaleFromHeight(height: Double, size: AFormat): Int

  def getScaleFromWidth(width: Double, size: AFormat): Int

  def getWidth(size: AFormat): Int

  def isLandscape: Boolean

  def isPortrait: Boolean = !isLandscape
}

case object Landscape extends PaperOrientation {
  override def getHeight(size: AFormat): Int = size.smaller

  override def getScaleFromHeight(height: Double, size: AFormat): Int = math.ceil(height / size.smaller).toInt

  override def getScaleFromWidth(width: Double, size: AFormat): Int = math.ceil(width / size.larger).toInt

  override def getWidth(size: AFormat): Int = size.larger

  override def isLandscape: Boolean = true

  override def toString = "landscape"
}

case object Portrait extends PaperOrientation {
  override def getHeight(size: AFormat): Int = size.larger

  override def getScaleFromHeight(height: Double, size: AFormat): Int = math.ceil(height / size.larger).toInt

  override def getScaleFromWidth(width: Double, size: AFormat): Int = math.ceil(width / size.smaller).toInt

  override def getWidth(size: AFormat): Int = size.smaller

  override def isLandscape: Boolean = false

  override def toString = "portrait"
}

