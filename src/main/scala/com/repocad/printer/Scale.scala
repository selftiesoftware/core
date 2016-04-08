package com.repocad.printer

import com.repocad.util.{Paper, Rectangle2D}


object Scale {

  /**
    * Creates a [[Scale]] object which rounds the most significant digit to 1, 2 or 5.
    *
    * @param scale The requested scale.
    * @return A scale with a rounded value.
    */
  def apply(scale: Int) = new Scale(roundScale(scale))

  /**
    * Creates a [[Scale]] that fits the given rectangle within the given paper.
    *
    * @param rectangle The rectangle representing the extend of a drawing.
    * @param paper     The paper containing the paper limits.
    * @return A scale with a rounded value.
    */
  def apply(rectangle: Rectangle2D, paper: Paper): Scale = {
    val heightRatio = paper.orientation.getScaleFromHeight(rectangle.height, paper.format)
    val widthRatio = paper.orientation.getScaleFromWidth(rectangle.width, paper.format)
    apply(math.max(heightRatio, widthRatio))
  }

  /**
    * Find a scale divisible with either 1,2 or 5
    */
  private def roundScale(scale: Int): Int = {
    val exp: Int = math.log10(scale).toInt
    val base: Double = math.pow(10, exp)

    // Give at least 1 in scale
    if (scale <= 1 * base) {
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
  * A ratio between one unit in a drawing and one unit in real life, rounded to 1, 2 or 5 in the most significant digit
  * (1, 2, 5, 10, 20, 50, etc.).
  *
  * @param value The scale value.
  */
sealed class Scale(val value: Int)
