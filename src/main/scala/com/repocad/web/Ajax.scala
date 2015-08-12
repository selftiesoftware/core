package com.repocad.web

import com.repocad.reposcript.{HttpClient, Response}
import org.scalajs.dom

/**
 * A synchronous implementation of a [[HttpClient]].
 */
object Ajax extends HttpClient {

  def ajax(method : String, url : String, data : String, headers : Map[String, String]) : Response = {
    try {
      val xhr = new dom.raw.XMLHttpRequest()
      xhr.open(method, url, async = false) // Handle synchronously
      headers.foreach(t => xhr.setRequestHeader(t._1, t._2))
      xhr.send(data)
      Response(xhr.status, xhr.readyState, xhr.responseText)
    } catch {
      case e : Throwable => Response(0, 0, "")
    }
  }

}