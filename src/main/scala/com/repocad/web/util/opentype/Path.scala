package com.repocad.web.util.opentype

import org.scalajs.dom.raw.CanvasRenderingContext2D

import scala.scalajs.js

trait Path {

  def draw(context: CanvasRenderingContext2D): Unit

  def setFill(colour: String): Unit

  def toSVG(decimalPlaces: Double): String

}

@js.native
trait OpentypePath extends js.Object {

  var fill: String = js.native

  def draw(context: CanvasRenderingContext2D): Unit

  def toSVG(decimalPlaces: Double): String

}
