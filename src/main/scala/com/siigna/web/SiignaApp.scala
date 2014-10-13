package com.siigna.web

import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

import scala.scalajs.js.JSApp
import scala.scalajs.js.annotation.JSExport

@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement) {

  @JSExport
  def start(): Unit = {
    val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
    context.fillStyle = "green"
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(100, 100)
    context.stroke()
  }

  @JSExport
  def drawLine(x1 : Int, y1 : Int, x2 : Int, y2 : Int) : Unit = {
    val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
  }


}