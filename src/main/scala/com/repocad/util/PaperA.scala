package com.repocad.util

/**
  * A paper that describes the format and rotation of a piece of paper.
  */
trait Paper {

  val center: Vector2D
  val orientation: PaperRotation
  val scale: Int

  /**
    * @return True if the paper is an instance of [[BoundlessPaper]].
    */
  val isBoundless: Boolean

}

object Paper {

  def apply(): PaperA = empty

  def apply(minX: Double, minY: Double, maxX: Double, maxY: Double): PaperA = {
    val height = maxY - minY
    val width = maxX - minX

    val center = Vector2D((minX + maxX) / 2, (minY + maxY) / 2)
    val orientation = if (width < height) Portrait else Landscape
    val scale = roundScale(math.max(orientation.getScaleFromHeight(height), orientation.getScaleFromWidth(width)))

    new PaperA(center, orientation, scale)
  }

  /**
    * A paper without bounds. Cannot and should not be drawn.
    */
  val boundless = BoundlessPaper
  val empty = new PaperA(Vector2D(0, 0), Portrait, 1)

  //find the appriate scale divisible with either 1,2 or 5
  private def roundScale(scale: Int): Int = {
    val exp: Int = math.log10(scale).toInt
    val base: Double = math.pow(10, exp)

    if (scale <= 1 * base) {
      // Give at least 1 in scale
      math.max(1, base.toInt)
    }
    else if (scale <= 2 * base) {
      (base * 2).toInt
    }
    else if (scale <= 5 * base) {
      (base * 5).toInt
    }
    else (base * 10).toInt
  }

}

/**
  * A paper that describes the dimension of a A-format paper oriented either horizontally (landscape) or vertically
  * (portrait).
  *
  * @param center      The center of the paper.
  * @param orientation The orientation of the paper.
  * @param scale       The scaling of the paper.
  */
case class PaperA(center: Vector2D, orientation: PaperRotation, scale: Int) extends Paper {

  val height: Double = orientation.getHeight(scale)
  val width: Double = orientation.getWidth(scale)

  val minX = center.x - width / 2
  val maxX = center.x + width / 2
  val minY = center.y - height / 2
  val maxY = center.y + height / 2
  override val isBoundless: Boolean = false
}

/**
  * A paper that does not have any boundaries. Useful if the paper should not occupy any space (i. e. not exist).
  */
case object BoundlessPaper extends Paper {
  override val center: Vector2D = Vector2D(0, 0)
  override val orientation: PaperRotation = Landscape
  override val scale: Int = 0
  override val isBoundless: Boolean = false
}

/**
  * In this domain a paper can be rotated as a portrait (where the width is larger than the height) a landscape
  * (where the height is larger than the width). Both follow the A-paper standard where the ratio is 297:210.
  */
trait PaperRotation {

  protected val A4Long: Int = 297
  protected val A4Short: Int = 210

  def getHeight(scale: Int): Double

  def getScaleFromHeight(height: Double): Int

  def getScaleFromWidth(width: Double): Int

  def getWidth(scale: Int): Double

  def isLandscape: Boolean

  def isPortrait: Boolean = !isLandscape
}

case object Landscape extends PaperRotation {
  override def getHeight(scale: Int): Double = A4Short * scale

  override def getScaleFromHeight(height: Double): Int = math.ceil(height / A4Short).toInt

  override def getScaleFromWidth(width: Double): Int = math.ceil(width / A4Long).toInt

  override def getWidth(scale: Int): Double = A4Long * scale.toInt

  override def isLandscape: Boolean = true

  override def toString = "landscape"
}

case object Portrait extends PaperRotation {
  override def getHeight(scale: Int): Double = A4Long * scale

  override def getScaleFromHeight(height: Double): Int = math.ceil(height / A4Long).toInt

  override def getScaleFromWidth(width: Double): Int = math.ceil(width / A4Short).toInt

  override def getWidth(scale: Int): Double = A4Short * scale

  override def isLandscape: Boolean = false

  override def toString = "portrait"
}