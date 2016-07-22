package com.repocad.web.util.opentype

import org.scalajs.dom.raw.CanvasRenderingContext2D

import scala.scalajs.js

@js.native
trait Path extends js.Object {

  var fill: String = js.native

  def draw(context: CanvasRenderingContext2D): Unit

  def toSVG(decimalPlaces: Double): String

}
