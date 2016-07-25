package com.repocad.web.util.opentype

import org.scalajs.dom.raw.CanvasRenderingContext2D

import scala.scalajs.js

trait Path {

  var fill: String = ""

  def draw(context: CanvasRenderingContext2D): Unit

  def toSVG(decimalPlaces: Double): String

}

@js.native
trait OpentypePath extends js.Object {

  var fill: String = js.native

  def draw(context: CanvasRenderingContext2D): Unit

  def toSVG(decimalPlaces: Double): String

}
