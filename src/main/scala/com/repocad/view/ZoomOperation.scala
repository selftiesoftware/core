package com.repocad.view

import com.repocad.geom.{Vector2D, TransformationMatrix}

object ZoomOperation {

  def zoom(transformation: TransformationMatrix, double: Double): TransformationMatrix = {
    transformation.scale(double)
  }

  def zoom(transformation: TransformationMatrix, double: Double, vector: Vector2D): TransformationMatrix = {
    transformation.translate(vector.x, vector.y).scale(double).translate(-vector.x, -vector.y)
  }

}
