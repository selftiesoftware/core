package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.{CanvasRenderingContext2D, HTMLCanvasElement}


/**
 * an object containing methods to draw the paper with the correct scale and orientation
 */

object Paper {

  def scaleAndRotation(): Boolean = {

    val autoScale = true

    val xMin = Evaluator.minX.getOrElse(-105.0)
    val xMax = Evaluator.maxX.getOrElse(105.0)
    val yMin = Evaluator.minY.getOrElse(-147.0)
    val yMax = Evaluator.maxY.getOrElse(147.0)

    var landscape = false

    var scale : Double = paperScale

    //val size = (newBoundary.bottomRight - newBoundary.topLeft).abs
    val bottomRight = Vector2D(xMax, yMin)
    val topLeft = Vector2D(xMin, yMax)
    val size = (bottomRight - topLeft).abs

    // Fetches the values for the format
    val printMargin = 13.0
    var shortSide = paperSize(0)
    var longSide = paperSize(1)

    //val center = drawingCenter
    drawingCenter = Vector2D(xMax - (xMax-xMin)/2,yMax - (yMax-yMin)/2)

    //calculate the scale automatically. Results in 1:1, 1:2,1:5,1:10,1:20 etc.
    if (autoScale) {
      paperScale = 1.0 //reset scale
      scale = 1
      var shortSide = 210.0 //reset side lengths
      var longSide = 297.0 //reset side lengths
      val list = List[Double](2, 2.5, 2) //1*(2) = 2 -- 2 * (2.5) = 5 -- 5 * (2) = 10 -- 10 * 2 = 20 etc.
      var take = 0 // which element to "take" from the above list
      while (shortSide < scala.math.min(size.x, size.y) || longSide < scala.math.max(size.x, size.y)) {
        val factor = list(take)
        shortSide *= factor
        longSide *= factor
        take = if (take < 2) take + 1 else 0
        paperScale = paperScale * factor
      }}

    if (size.x >= size.y) landscape = true

    landscape //return
  }
}