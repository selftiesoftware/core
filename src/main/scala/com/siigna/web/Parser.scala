package com.siigna.web

import org.scalajs.dom.CanvasRenderingContext2D

import scala.util.matching.Regex

/**
 * Parses code into drawing commands
 */
object Parser {

  val lineExpr : Regex = """line (\d*) (\d*) (\d*) (\d*)""".r
  val commentExpr : Regex = """//.*""".r

  def parse(code : String, context : CanvasRenderingContext2D) : Unit = {
    code.lines.foreach( line => parseLine(line, context) )
  }

  def parseLine(line : String, context : CanvasRenderingContext2D): Unit = {
    line match {
      case lineExpr(x1, y1, x2, y2) => {
        context.beginPath()
        context.moveTo(x1.toDouble, y1.toDouble)
        context.lineTo(x2.toDouble, y2.toDouble)
        context.stroke()
        context.closePath()
      }
      case commentExpr => // Do nothing
    }
  }

}
