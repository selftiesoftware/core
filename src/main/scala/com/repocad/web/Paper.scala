package com.repocad.web

import com.repocad.web.evaluating.Evaluator
import org.scalajs.dom.CanvasRenderingContext2D

/**
 * an object containing methods to draw the paper with the correct scale and orientation
 */

case class Paper ( var minX : Double = -105.0, var maxX : Double = 105.0, var minY : Double = -147.0, var maxY : Double = 147.0) {

  /* run once before the evaluation loop to ensure the paper is scaled down again
   if the drawing extends are smaller after user editing of the drawing.
*/
  def resetBoundingBox() = {
    maxX = 210/2
    minX = -210/2
    maxY = 297/2
    minY = -297/2
  }

  def scaleAndRotation(): Boolean = {

    val autoScale = true

    val height = maxX - minX
    val width = maxY - minY

    println("X: "+height)
    println("Y: "+width)

    //var landscape = if(height > width) false else true
    var landscape = false
    var scale : Double = paperScale

    //val size = (newBoundary.bottomRight - newBoundary.topLeft).abs
    val bottomRight = Vector2D(maxX, minY)
    val topLeft = Vector2D(minX, maxY)
    val size = (bottomRight - topLeft).abs

    // Fetches the values for the format
    val printMargin = 13.0
    var shortSide = paperSize(0)
    var longSide = paperSize(1)

    //val center = drawingCenter
    drawingCenter = Vector2D(maxX - (maxX-minX)/2,maxY - (maxY-minY)/2)

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