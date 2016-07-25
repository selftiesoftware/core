package com.repocad.web.util.opentype

import scala.scalajs.js

trait Glyph {

  val advanceWidth: Double
  val xMin: Double
  val xMax: Double
  val yMin: Double
  val yMax: Double

  def height = yMax - yMin

  def width = xMax - xMin

}

@js.native
trait OpentypeGlyph extends js.Object {

  val advanceWidth: Double
  val xMin: Double
  val xMax: Double
  val yMin: Double
  val yMax: Double

  def font: OpentypeFont
}
