package com.siigna.web

import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}

import scala.scalajs.js.JSApp
import scala.scalajs.js.annotation.JSExport

@JSExport("Siigna")
class Siigna(canvas : HTMLCanvasElement) {

  val context = canvas.getContext("2d").asInstanceOf[CanvasRenderingContext2D]

  @JSExport
  def clear() : Unit = {
    context.clearRect(0, 0, 10000, 10000);
  }

  @JSExport
  def parse(code : String) : Unit = {
    val tokens      = Lexer(code, "")
    val expressions = Parser.parse(tokens)

    expressions match {
      case Right(xs) => new Evaluator(context).evaluate(xs, _ => (), ys => println(ys))
      case rest => {
        println(rest)
      }
    }
  }


}