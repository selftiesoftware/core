/*
 * Copyright (c) 2008-2015, Selftie Software. repocad is released under the
 * creative common license by-nc-sa. You are free
 *   to Share — to copy, distribute and transmit the work,
 *   to Remix — to adapt the work
 *
 * Under the following conditions:
 *   Attribution —   You must attribute the work to http://repocad.com in
 *                    the manner specified by the author or licensor (but
 *                    not in any way that suggests that they endorse you
 *                    or your use of the work).
 *   Noncommercial — You may not use this work for commercial purposes.
 *   Share Alike   — If you alter, transform, or build upon this work, you
 *                    may distribute the resulting work only under the
 *                    same or similar license to this one.
 *
 * Read more at http://repocad.com and https://github.com/repocad
 */

package com.repocad.util

/**
 * A vector class utility.
 */
trait Vector {

  type T <: Vector

  /**
   * Returns the sum of this vector with another vector.
   */
  def +(other : T) : T

  /**
   * Subtracts this vector with another vector.
   */
  def -(other : T) : T

  /**
   * The product of this vector with another vector and retrieve the dot-product.
   */
  def *(other : T) : Double

  /**
   * Multiplies a vector with a scalar.
   */
  def *(scalar : Double) : T

  /**
   * Divides a vector with a number.
   */
  def /(scale : Double) : T

  /**
   * Rotates the vector 180 degrees by multiplying with (-1). This gives a vector
   * pointing in the opposite direction.
   */
  def unary_- : T

  /**
   * Returns the absolute value of the vector.
   */
  def abs : T

  /**
   * Gives an angle (in degrees) for the vector relative to the x-axis CCW. Zero degrees indicate
   * that the vector is on the positive x-axis.
   *
   * @return  a number between 0 and 360, calculated counter-clockwise from the (positive) x-axis.
   */
  def angle : Double

  /**
   * Calculates the length of the vector.
   */
  def length : Double

  /**
   * Calculates the vector rotated 90 degrees counter-clockwise.
   */
  def normal : T

  /**
   * Rounds the vector to whole numbers.
   */
  def round : T

  /**
   * Calculates the unit-vector of this vector. If the length of the vector is <= [[scala.Double#MinPositiveValue]] we
   * return a zero vector instead.
   */
  def unit : T

}

/**
 * Utility functions for vectors.
 *
 * @see Vector
 */
object Vector {

  /**
   * Parses a string as a ND vector. Here is an example of the expected format:
   * <code>(3.14, 7)</code>.
   *
   * <p>
   * The string must start and end with parentheses and
   * include exactly two double values (integers are also doubles) which is
   * seperated by comma. Extra white-space inside the parentheses is discarded.
   * White-space outside the parentheses is NOT expected, so if you are unsure
   * whether there is white-space in your string or not, please
   * <code>trim</code> your string before invoking this function.
   * </p>
   *
   * @param  value  containing a representation of a vector.
   * @return  a new vector parsed from the string content.
   */
  def parseVector(value : String) = {
    if (value.startsWith("(") && value.endsWith(")")) {
      val coordinates =
        try {
          value substring(1, value.size - 1) split "\\," map(
            coordinate => java.lang.Double parseDouble(coordinate trim)
            )
        } catch {
          case ex : Exception => throw new IllegalArgumentException("Expected a numeric 2D vector, got: " + value, ex)
        }
      if (coordinates.size != 2)
        throw new IllegalArgumentException("Expected a 2-dimensional vector, got: " + value)
      Vector2D(coordinates(0), coordinates(1))
    } else {
      throw new IllegalArgumentException("Expected a vector, got: " + value)
    }
  }

}

/**
 * A vector class utility.
 */
case class Vector2D(x : Double, y : Double) extends Vector {

  type T = Vector2D

  /**
   * Returns the sum of this vector with another vector.
   */
  def +(other : Vector2D) = Vector2D(x + other.x, y + other.y)

  /**
   * Subtracts this vector with another vector.
   */
  def -(other : Vector2D) = Vector2D(x - other.x, y - other.y)

  /**
   * Multiplies a vector with a number.
   */
  def *(scale : Double) = Vector2D(x * scale, y * scale)

  /**
   * The scalar product of this vector with another vector.
   */
  def *(that : Vector2D) : Double = x * that.x + y * that.y

  /**
   * Divides a vector with a number.
   */
  def /(scale : Double) = Vector2D(x / scale, y / scale)

  /**
   * Rotates the vector 180 degrees by multiplying with (-1). This gives a vector
   * pointing in the opposite direction.
   */
  def unary_- = Vector2D(-x, -y)

  /**
   * Returns the absolute value of the vector.
   */
  def abs = Vector2D(scala.math.abs(this.x), scala.math.abs(this.y))

  /**
   * Gives an angle (in degrees) for the vector relative to the x-axis CCW. Zero degrees indicate
   * that the vector is on the positive x-axis.
   *
   * @return  a number between 0 and 360, calculated counter-clockwise from the (positive) x-axis.
   */
  def angle = {
    val degrees = scala.math.atan2(y, x) * 180 / scala.math.Pi
    if (degrees < 0)
      degrees + 360
    else
      degrees
  }

  /**
   * Gets the distance to another vector.
   */
  def distanceTo(point : Vector2D) = (point - this).length

  /**
   * Determine if two Vector2Ds coinside. Uses the absolute tolerance epsilon, set in main/util/geom/package
   */
  override def equals(obj:Any) : Boolean = {
    obj match {
      case v : Vector2D =>  (math.abs(this.x - v.x) < epsilon) && (math.abs(this.y - v.y) < epsilon)
      case _ => false
    }
  }

  /**
   * Calculates the length of the vector.
   */
  def length = java.lang.Math.hypot(x, y)

  /**
   * Calculates the vector rotated 90 degrees counter-clockwise.
   */
  def normal = Vector2D(-y, x)

  /**
   * Rounds the vector to whole numbers.
   * @return  A vector whose coordinates have been rounded to the nearest whole number.
   */
  def round = Vector2D(scala.math.round(x), scala.math.round(y))

  /**
   * Rounds the vector to two decimals.
   * @return  A vector whose coordinates have been rounded to the nearest 0.01.
   */
  def roundTwoDec = Vector2D(scala.math.round(x*100)/100, scala.math.round(y*100)/100)

  def unit = if (length <= Double.MinPositiveValue) Vector2D(0, 0) else Vector2D(this.x / this.length, this.y / this.length)
}

/**
 * Companion object to Vector2D.
 */
object Vector2D {

  /**
   * Calculates the determinant of the 2x2 matrix described by two vectors.
   *
   * <p>
   * The matrix is defined like this:
   * <pre>
   *     | a.x  b.x |             or    | a.x  a.y |
   *     | a.y  b.y | (columns)         | b.x  b.y | (rows)
   * </pre>
   * </p>
   *
   * @param  a  the first column (or row) of the determinant matrix.
   * @param  b  the second column (or row) of the determinant matrix.
   * @return  the determinant value.
   */
  def determinant(a : Vector2D, b : Vector2D) = a.x * b.y - a.y * b.x

  /**
   * Calculates the shortest angle between two vectors.
   *
   * @param  v1  the first vector.
   * @param  v2  the second vector.
   * @return  the angle between the two vectors in degrees.
   */
  def shortestAngleBetweenVectors(v1 : Vector2D, v2 : Vector2D) = {
    val scalar = v1.length * v2.length
    if (scalar != 0) {
      val inner = v1 * v2 / scalar
      scala.math.acos(inner) * 180 / scala.math.Pi
    } else 0.0
  }
}