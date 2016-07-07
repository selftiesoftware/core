package com.repocad.web.util.opentype

import scala.scalajs.js

@js.native
trait Glyph extends js.Object {

  val advanceWidth: Double
  val xMin: Double
  val xMax: Double
  val yMin: Double
  val yMax: Double

  def font: Font

}
