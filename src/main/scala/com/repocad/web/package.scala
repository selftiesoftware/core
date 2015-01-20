package com.repocad

/**
 * A web project for Repocad
 */
package object web {

  println("INITIATING WEB")
  /**
   * The absolute double tolerance in Repocad
   * @return the tolerance
   */
  val epsilon = 0.00001

  /**
   * The paper scale in Repocad
   * @return the current scale
   */
  //TODO: allow users to set a scale in the drawing by typing eg.: scale = 5
  var paperScale = 1.0

  /** The center of the drawing
    * @return the center vector
    */
  var drawingCenter : Vector2D = Vector2D(105,147)

  /**
   * The size of the drawing paper. Defaults to A4
   * @return width and height of the paper
   */

  var paperSize : List[Double] = List(210,297)

}
