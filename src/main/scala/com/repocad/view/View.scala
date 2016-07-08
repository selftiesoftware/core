package com.repocad.view

import com.repocad.geom.TransformationMatrix
import com.repocad.view.event.Event

/**
  * A view is a visual interface which contains the facilities for
  * retrieving state represented by a [[TransformationMatrix]] describing the state of the view and an optional
  * [[Event]] sent by the user interacting with the visual interface. The [[TransformationMatrix]] can then be used
  * in the [[ModelRenderer]] to render the current model.
  *
  * @see [[ModelRenderer]]
  */
trait View {

  private var _transformation = TransformationMatrix()

  /**
    * A polling operation which retrieves the current state of the view as a [[TransformationMatrix]] plus possibly an
    * event (if the user interacted with the interface since the last poll), and returns a new state to be stored in
    * the view.
    *
    * @param tick A function which returns a new state ([[TransformationMatrix]]) given a state and an event.
    * @return A tuple of a [[TransformationMatrix]] and [[Option]] of [[Event]].
    */
  def apply(tick: (TransformationMatrix, Option[Event]) => TransformationMatrix): Unit = {
    val state = getState
    _transformation = tick(state._1, state._2)
  }

  protected def getState: (TransformationMatrix, Option[Event])

  protected def transformation: TransformationMatrix = _transformation

}
