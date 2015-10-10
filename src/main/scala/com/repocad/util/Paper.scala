package com.repocad.util

/**
 * A paper that
 */
case class Paper(center : Vector2D, orientation : PaperRotation, scale : Int) {

  lazy val height : Double = orientation.getHeight(scale)
  lazy val width : Double = orientation.getWidth(scale)

  lazy val minX = center.x - width / 2
  lazy val maxX = center.x + width / 2
  lazy val minY = center.y - height / 2
  lazy val maxY = center.y + height / 2

}

object Paper {

  //find the appriate scale divisible with either 1,2 or 5
  private def roundScale (scale : Int) : Int = {
     val exp : Int = math.log10(scale).toInt
     val base : Double = math.pow(10,exp)

    if(scale <= 1 * base) {
      base.toInt
    }
    else if (scale <= 2 * base) {
      (base * 2).toInt
    }
    else if (scale <= 5 * base) {
      (base * 5).toInt
    }
    else (base * 10).toInt
  }

  def apply() : Paper = new Paper(Vector2D(0, 0), Portrait, 1)

  def apply(minX : Double, minY : Double, maxX : Double, maxY : Double) : Paper = {
    val height = maxY - minY
    val width = maxX - minX

    val center = Vector2D((minX + maxX) / 2, (minY + maxY) / 2)
    val orientation = if (width < height) Portrait else Landscape
    val scale = roundScale(math.max(orientation.getScaleFromHeight(height), orientation.getScaleFromWidth(width)))

    new Paper(center, orientation, scale)
  }

}

trait PaperRotation {

  protected val A4Long : Int = 297
  protected val A4Short : Int = 210

  def getHeight(scale : Int) : Double
  def getScaleFromHeight(height : Double) : Int
  def getScaleFromWidth(width : Double) : Int
  def getWidth(scale : Int) : Double

  def isLandscape : Boolean
  def isPortrait : Boolean = !isLandscape
}

case object Landscape extends PaperRotation {
  override def getHeight(scale: Int): Double = A4Short * scale
  override def getScaleFromHeight(height: Double): Int = math.ceil(height / A4Long).toInt
  override def getScaleFromWidth(width: Double): Int = math.ceil(width / A4Short).toInt
  override def getWidth(scale: Int): Double = A4Long * scale.toInt
  override def isLandscape: Boolean = true
  override def toString = "landscape"
}

case object Portrait extends PaperRotation {
  override def getHeight(scale: Int): Double = A4Long * scale
  override def getScaleFromHeight(height: Double): Int = math.ceil(height / A4Short).toInt
  override def getScaleFromWidth(width: Double): Int = math.ceil(width / A4Long).toInt
  override def getWidth(scale: Int): Double = A4Short * scale
  override def isLandscape: Boolean = false
  override def toString = "portrait"
}