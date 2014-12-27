package com.siigna.web

import scala.scalajs.js

/**
 * A printer that can generate pdf files
 */
class PdfPrinter extends Printer {

  val document = js.Dynamic.global.jsPDF()

  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double) : Unit = {
    val v1 = transform(Vector2D(x1, y1))
    val v2 = transform(Vector2D(x2, y2))
    document.line(v1.x, v1.y, v2.x, v2.y)
  }

  private def transform(v : Vector2D): Vector2D = {
    //scale the artwork based on the current paper scale
    val vec =  Vector2D(v.x / 2,v.y / 2)
    //Transform by moving (0, 0) to center of paper
    vec + Vector2D(105,147)



  }

  def save(name : String): Unit = {
    document.save(name)
  }

}
