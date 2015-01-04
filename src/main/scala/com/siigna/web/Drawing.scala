package com.siigna.web

import org.scalajs.dom
import org.scalajs.dom._
import scala.scalajs.js

/**
 * A drawing that is automatically synched
 */
sealed case class Drawing(name : String, content : String)

object Drawing {

  def apply() : Drawing = {
    val hash = window.location.hash.replace("#", "")
    def getDefault = Drawing.get("default")
    (if (hash.isEmpty) {
      getDefault
    } else {
      Drawing.get(hash)
    }).left.map(_ => Drawing(js.Math.random().toString.substring(7), "line 0 0 100 100")).merge
  }

  private var listener : () => js.Any = () => ()

  dom.setInterval(() => listener(), 100)

  def get(name : String) : Either[String, Drawing] = {
    Ajax("http://siigna.com:20004/get/" + name).right.map(content => Drawing(name, content))
  }

  def setHashListener(fn : (String) => Unit) = {
    var oldLocation = window.location.hash
    listener = () => {
      val newLocation = window.location.hash
      if (newLocation != oldLocation) {
        oldLocation = newLocation
        fn(newLocation.substring(1))
      }
    }
  }

  //private def getDrawing()

}
