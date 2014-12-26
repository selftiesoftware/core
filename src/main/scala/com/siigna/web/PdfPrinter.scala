package com.siigna.web

import scala.scalajs.js

/**
 * A printer that can generate pdf files
 */
class PdfPrinter extends Printer {

  val document = js.Dynamic.global.jsPDF()

  def line(x1 : Double, y1 : Double, x2 : Double, y2 : Double) : Unit = {
    document.line(x1, y1, x2, y2)
  }

  def save(name : String): Unit = {
    document.save(name)
  }

}
