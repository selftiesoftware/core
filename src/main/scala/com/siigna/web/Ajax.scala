package com.siigna.web

import org.scalajs.dom

case class Response(status : Int, state : Int, response : String)

object Response {
  def apply(xhr : dom.XMLHttpRequest) : Response = {
    Response(xhr.status, xhr.readyState, xhr.responseText)
  }
}

/**
 * A synchronous ajax object
 */
object Ajax {

  def get(url : String) : Response = {
    ajax("GET", url, "", Map())
  }

  def post(url : String, data : String) : Response = {
    ajax("POST", url, data, Map("Content-length" -> data.length.toString))
  }

  private def ajax(method : String, url : String, data : String, headers : Map[String, String]) : Response = {
    val xhr = new dom.XMLHttpRequest()
    xhr.open(method, url, async = false) // Handle synchronously
    headers.foreach(t => xhr.setRequestHeader(t._1, t._2))
    try {
      xhr.send(data)
      Response(xhr)
    } catch {
      case e : Throwable => Response(0, 0, "")
    }
  }

}