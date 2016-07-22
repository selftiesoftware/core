package com.repocad.view

import com.repocad.geom.TransformationMatrix
import com.repocad.view.event.Event

/**
  * A view filter is a 'filter' capable of wrapping the events coming from the view and manipulating them in some way.
  */
abstract class ViewFilter(view: View) extends View {

  override def state: (ViewFilter, Option[Event])

  def transformation: TransformationMatrix

}
