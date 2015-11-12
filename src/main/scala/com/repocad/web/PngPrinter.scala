package com.repocad.web

import com.repocad.util.Vector2D
import com.repocad.reposcript.parsing.Expr
import org.scalajs.dom.raw.HTMLCanvasElement

/*
Make a png from a canvas.
Returns a DataUTL string containing an image which is focus on the paper only.
 */
class PngPrinter(canvas : HTMLCanvasElement, expr: Expr, printer : CanvasPrinter)  {

  //call zoom extends to get a print of the entire paper


  //make a png
  def save = canvas.toDataURL("image/png")

  //reset zoom
  //zoom(1/zoomFocus,1/zoomFocus,1/zoomFocus)

  //reset pan
  //translate(1/panFocus.x,1/panFocus.y)
}
