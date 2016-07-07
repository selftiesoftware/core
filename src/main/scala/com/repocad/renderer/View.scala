package com.repocad.renderer

import com.repocad.geom.Vector2D
import com.repocad.web.util.event.Event

/**
  * A view is a visual interface which contains the facilities for rendering a model (via a [[ModelRenderer]]) and
  * retrieving [[Event]]s sent by the user interacting with the visual interface.
  */
trait View {

  /**
    * Enqueues an event from the UI to be processed by the application later.
    *
    * @param event The event to enqueue.
    */
  protected def enqueue(event: Event): Unit

  /**
    * An iterator over events produced by the user's interaction with the view. Even though calls to the iterators
    * ``hasNext`` method returns false, more events could arrive in the future.
    *
    * @return An endless [[Iterator]] over [[Event]]s
    */
  def events: Iterator[Event]

  /**
    * A [[ModelRenderer]] capable of rendering a [[com.repocad.reposcript.model.ShapeModel]] or perform simple rendering
    * tasks like lines, circles etc. inherited from the [[com.repocad.reposcript.Renderer]] trait.
    *
    * @return A [[ModelRenderer]].
    */
  def renderer: ModelRenderer

  /**
    * Zooms the view to the given position.
    *
    * @param delta  The delta to zoom. 0 > delta < 1 to zoom out. 1 > delta to zoom in. Cannot be less than zero.
    * @param center The center of the zoom operation.
    */
  def zoom(delta: Double, center: Vector2D): Unit

  /**
    * Reset the zoom to cover the entire drawing and pan to the center of the drawing.
    */
  def zoomExtends(): Unit

}
