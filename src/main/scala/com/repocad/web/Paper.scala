package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}


/**
 * an object containing methods to scale the drawing paper
 */

object Paper {

  //TODO: allow setting a fixed paper scale in the script: eg. by setting a variable "paperScale = 2
  def scaleAndCoords(xMin: Double, xMax: Double, yMin: Double, yMax: Double): List[Double] = {

    val autoScale = true //TODO; change to false if the user has typed "scale = xx" somewhere in the drawing

    //flipY:
    val yMaxF : Double = yMax * -1
    val yMinF : Double= yMin * -1

    var landscape = 1.0

    var scale : Double = 1.0

    //val size = (newBoundary.bottomRight - newBoundary.topLeft).abs
    val bottomRight = Vector2D(xMax, yMinF)
    val topLeft = Vector2D(xMin, yMaxF)
    val size = (bottomRight - topLeft).abs

    // Fetches the values for the format
    val printMargin = 13.0
    var shortSide = 210.0
    var longSide = 297.0

    var center : Vector2D = Vector2D(((xMax - xMin) / 2) + xMin,((yMaxF - yMinF) / 2) + yMinF)

    //calculate the scale automatically. Results in 1:1, 1:2,1:5,1:10,1:20 etc.
    if (autoScale) {
      scale = 1 //reset scale
      val list = List[Double](2, 2.5, 2) //1*(2) = 2 -- 2 * (2.5) = 5 -- 5 * (2) = 10 -- 10 * 2 = 20 etc.
      var take = 0 // which element to "take" from the above list
      while (shortSide < scala.math.min(size.x, size.y) || longSide < scala.math.max(size.x, size.y)) {
        val factor = list(take)
        shortSide *= factor
        longSide *= factor
        take = if (take < 2) take + 1 else 0
        scale = scale * factor
      }
    }

    //TODO: allow users to set a scale in the drawing by typing eg.: scale = 5
    // calculate the paper size on the basis of the scale factor specified by the user
    //else {
    //  if (Repocad.double("scale").isDefined) shortSide *= Repocad.double("scale").get else shortSide
    //  if (Repocad.double("scale").isDefined) longSide *= rRepocad.double("scale").get else longSide
    // }

    // Augment the "paper" with the print margins.
    //shortSide += printMargin
    //longSide += printMargin
    // return size based on whether the paper is landscape or protrait
    // offseting x and y to center the drawing correctly based on the current scale

    var leftX = xMin
    var topY = yMinF
    var width = shortSide
    var height = longSide

    if (size.x >= size.y) { //landscape
      landscape = 0.0
      //println("factor: "+factor)
      //leftX = xMin * factor - (longSide * 0.5)
      leftX = center.x  - (longSide * 0.5)
      //bottomY = yMin * factor - (shortSide * 0.5)
      topY = center.y - (shortSide * 0.5)
      width = longSide
      height = shortSide

    } else { //portrait

      //leftX = xMin * factor - (shortSide * 0.5)
      leftX = center.x - (shortSide * 0.5)
      //bottomY = yMin * factor - (longSide * 0.5)
      topY = center.y - (longSide * 0.5)
      width = shortSide
      height = longSide
    }

    val calculatedPaper = List(leftX, topY, width, height, scale,landscape)
    calculatedPaper //return
  }
}