package com.repocad.web

import com.repocad.remote.Response

import scala.concurrent.Future
import scala.scalajs.js.annotation.JSExport

/**
  * A drawing that is automatically synched
  */
case class Drawing(name: String, content: String)

@JSExport("Drawing")
object Drawing {
  val empty = new Drawing("empty", "")

  def get(name: String): Future[Drawing] = {
    Ajax.get("get/" + name).future.flatMap({
      case Response(code, _, _) if code != 200 => Future.failed(new Exception("Failed to fetch drawing: HTTP code " + code))
      case Response(status, state, content) => Future.successful(Drawing(name, content))
    })
  }

}
