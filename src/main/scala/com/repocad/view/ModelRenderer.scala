package com.repocad.view

import com.repocad.geom.TransformationMatrix
import com.repocad.reposcript.Renderer
import com.repocad.reposcript.model.{FontMetrics, ShapeModel}

/**
  * Renders objects on a medium.
  */
trait ModelRenderer extends Renderer with FontMetrics {

  /**
    * Renders the given model.
    *
    * @param shapeModel     The model to render.
    * @param transformation The matrix to apply when rendering.
    */
  def render(shapeModel: ShapeModel, transformation: TransformationMatrix): Unit
  def renderWithZoomExtends(shapeModel: ShapeModel): TransformationMatrix
}
