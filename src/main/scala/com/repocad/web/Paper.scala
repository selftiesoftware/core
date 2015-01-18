package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}


/**
 * an object containing methods to scale the drawing paper
 */

object Paper {

  //TODO: allow setting a fixed paper scale in the script: eg. by setting a variable "paperScale = 2
  def scaleAndCoords(wMin: Double, wMax: Double, hMin: Double, hMax: Double): List[Double] = {

    println("running s and c")
    val autoScale = true //TODO; change to false if the user has typed "scale = xx" somewhere in the drawing

    //val size = (newBoundary.bottomRight - newBoundary.topLeft).abs
    val bottomRight = Vector2D(wMin, hMin)
    val topLeft = Vector2D(wMax, hMax)
    val size = (bottomRight - topLeft).abs

    // Fetches the values for the format
    val printMargin = 13.0
    var aFormatMin = 210.0
    var aFormatMax = 297.0

    //calculate the drawing width, height and center
    val w = wMax - wMin //width
    val h = hMax - hMin //height

    var xMin = 0
    var yMin = 0

    val center = Vector2D(w / 2 + wMin, h / 2 + hMin)

    //calculate the scale automatically. Results in 1:1, 1:2,1:5,1:10,1:20 etc.
    if (autoScale) {
      val list = List[Double](2, 2.5, 2)
      var take = 0 // which element to "take" from the above list
      while (aFormatMin < scala.math.min(size.x, size.y) || aFormatMax < scala.math.max(size.x, size.y)) {
        val factor = list(take)
        aFormatMin *= factor
        aFormatMax *= factor
        take = if (take < 2) take + 1 else 0
      }
    }
    //TODO: allow users to set a scale in the drawing by typing eg.: scale = 5
    // calculate the paper size on the basis of the scale factor specified by the user
    //else {
    //  if (Repocad.double("scale").isDefined) aFormatMin *= Repocad.double("scale").get else aFormatMin
    //  if (Repocad.double("scale").isDefined) aFormatMax *= rRepocad.double("scale").get else aFormatMax
    // }

    // Augment the "paper" with the print margins.
    aFormatMin += printMargin
    aFormatMax += printMargin
    // return size based on whether the paper is landscape or protrait
    // offseting x and y to center the drawing ocrrectly based on the current scale

    if (size.x >= size.y) {
    val leftX = center.x - aFormatMax * 0.5
    val leftY = center.y - aFormatMin * 0.5

    } else {
    //  SimpleRectangle2D(center.x - aFormatMin * 0.5, center.y - aFormatMax * 0.5,
    //    center.x + aFormatMin * 0.5, center.y + aFormatMax * 0.5)
    }

    xMin =

    val calculatedPaper = List(xMin, yMin, aFormatMin, aFormatMax)

    println("return; " + calculatedPaper)
    calculatedPaper //return
  }
}