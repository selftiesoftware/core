package com.repocad.web

import com.repocad.reposcript.{HttpClient, Response}
import org.scalajs.dom
import org.scalajs.dom._

import scala.collection.mutable
import scala.concurrent.Future
import scala.scalajs.js
import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue

/**
 * A drawing that is automatically synched
 */
sealed case class Drawing(name : String, content : String) {
  //saves the drawing to github
  def save(httpClient : HttpClient): Future[Response] = {
    val urlName = js.Dynamic.global.encodeURI(name)
    httpClient.post("post/" + urlName, content)
  }
  //saves the drawing to github
  def saveThumbnail(httpClient : HttpClient, data : String): Future[Response] = {
    val urlName = js.Dynamic.global.encodeURI(name)
    httpClient.post("thumbnail/" + urlName, data)
  }
}

object Drawing {

  /* Lazily load drawings */
  private val drawingList : mutable.Seq[String] = mutable.Seq()

  Ajax.get("list/") map {
    case Response(_, _, text) => text.split("\n").filter(!_.endsWith("/")).toSeq
  } foreach {
    list => drawings ++ list
  }

  def apply() : Drawing = {
    val hash = window.location.hash.replace("#", "")
    def getDefault = Drawing.get("default")
    (if (hash.isEmpty) {
      getDefault
    } else {
      Drawing.get(hash)
    }).left.map(_ => Drawing(js.Math.random().toString.substring(7), "")).merge
  }

  def drawings = drawingList

  private var listener : () => js.Any = () => ()

  dom.setInterval(() => listener(), 100)

  def get(name : String) : Either[String, Drawing] = {
    Ajax.getSynchronous("get/" + name) match {
      case Response(404, _, _) => Right(Drawing(name, ""))
      case Response(status, state, response) => Right(Drawing(name, response))
    }
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



}
