package com.siigna.web

import scala.scalajs.js

/**
 * Created by oep on 26-12-2014.
 */
trait Printer {

  def circle(x : Double, y : Double, r : Double)
  def text(x : Double, y : Double, h : Double)
  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double)

}
