package com.siigna.web

import com.siigna.web.lexing.{LiveStream, Lexer}
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
    val stream = LiveStream(code)
    val lexer = new Lexer()
    lexer.lex(stream)
    val tokens = lexer.output
    val expressions = Parser.parse(tokens)

    expressions match {
      case Right(xs) => {
        val it = xs.iterator
        while (it.hasNext) {
          new Evaluator(context).evaluate(it.next(), Map(), (x : Any) => (), ys => println(ys))
        }
      }
      case rest => {
        println(rest)
      }
    }
  }


}