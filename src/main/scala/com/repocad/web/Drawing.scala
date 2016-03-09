package com.repocad.web

import com.repocad.reposcript.{HttpClient, Response}
import org.scalajs.dom
import org.scalajs.dom._

import scala.concurrent.Future
import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue
import scala.scalajs.js
import scala.scalajs.js.JSConverters.JSRichGenTraversableOnce
import scala.scalajs.js.annotation.JSExport
import scala.util.{Failure, Success}

/**
  * A drawing that is automatically synched
  */
case class Drawing(name: String, content: String) {
  //saves the drawing to github
  def save(httpClient: HttpClient): Future[Response] = {
    val urlName = js.Dynamic.global.encodeURI(name)
    httpClient.post("post/" + urlName, content)
  }

  //saves the drawing to github
  def saveThumbnail(httpClient: HttpClient, data: String): Future[Response] = {
    val urlName = js.Dynamic.global.encodeURI(name)
    httpClient.post("thumbnail/" + urlName, data)
  }
}

@JSExport("Drawing")
object Drawing {

  /* Lazily load drawings */
  private var cachedDrawings: Option[Seq[String]] = None

  def apply(): Drawing = {
    val hash = window.location.hash.replace("#", "")
    def getDefault = Drawing.get("default")
    (if (hash.isEmpty) {
      getDefault
    } else {
      Drawing.get(hash.toLowerCase)
    }).left.map(_ => Drawing(js.Math.random().toString.substring(7), "")).merge
  }

  def drawings = {
    if (cachedDrawings.isEmpty) {
      cachedDrawings = Ajax.getSynchronous("list/") match {
        case Response(_, _, text) => Some(text.split("\n").filter(!_.endsWith("/")).toSeq)
      }
    }
    cachedDrawings.get
  }

  val empty = new Drawing("empty", "")

  @JSExport
  def javascriptDrawings = new JSRichGenTraversableOnce[String](Drawing.drawings).toJSArray

  private var listener: () => js.Any = () => ()

  dom.setInterval(() => listener(), 100)

  def get(name: String): Either[String, Drawing] = {
    getDrawingFromResponse(name, Ajax.getSynchronous("get/" + name))
  }

  def getAsync(name: String, onComplete: Either[String, Drawing] => Unit): Unit = {
    Ajax.get("get/" + name).onComplete({
      case Success(response) => onComplete(getDrawingFromResponse(name, response))
      case Failure(error) => onComplete(Left(error.toString))
    })
  }

  def getDrawingFromResponse(name: String, response: Response): Either[String, Drawing] = {
    response match {
      case Response(404, _, _) => Right(Drawing(name, ""))
      case Response(status, state, content) => Right(Drawing(name, content))
    }
  }

  def setHashListener(fn: (String) => Unit) = {
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
