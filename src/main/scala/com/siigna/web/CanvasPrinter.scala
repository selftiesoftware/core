package com.siigna.web

import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

import scala.scalajs.js

/**
 * Created by oep on 26-12-2014.
 */
class CanvasPrinter extends Printer {

  var context : CanvasRenderingContext2D = null

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.closePath()
  }

}
