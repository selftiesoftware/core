package com.repocad.view

import com.repocad.geom.TransformationMatrix
import com.repocad.view.event.Event

/**
  * A view filter is a 'filter' capable of wrapping the events coming from the view and manipulating them in some way.
  */
trait ViewFilter extends ((TransformationMatrix, Option[Event]) => (TransformationMatrix, Option[Event]))
