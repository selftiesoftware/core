package com.repocad.view

import com.repocad.view.event.Event

trait View {

  def state: (View, Option[Event])

}
