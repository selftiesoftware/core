package com.repocad.web

import com.repocad.reposcript.{HttpClient, Response}
import org.scalajs.dom
import org.scalajs.dom.{Event, XMLHttpRequest}

import scala.concurrent.{Future, Promise}

/**
 * An implementation of a [[HttpClient]].
 */
object Ajax extends HttpClient {

  val baseUrl = "http://repocad.com:20004/"

  private val defaultHeaders = Map("Access-Control-Allow-Origin" -> "*")

  def apply(method : String, url : String, data : String, headers : Map[String, String]) : Future[Response] = {
    val xhr = createRequest(method, url, data, headers, sync = true)
    val promise = Promise[Response]()

    xhr.onreadystatechange = (e : Event) => {
      if (xhr.readyState == 4) {
        promise.success(Response(xhr.status, xhr.readyState, xhr.responseText))
      }
    }

    xhr.send(data)

    promise.future
  }

  def applySynchronous(method : String, url : String, data : String, headers : Map[String, String]) : Response = {
    try {
      val xhr = createRequest(method, url, data, headers, sync = false)
      xhr.send(data)
      Response(xhr.status, xhr.readyState, xhr.responseText)
    } catch {
      case e : Throwable => Response(0, 0, e.toString)
    }
  }

  private def createRequest(method : String, url : String, data : String, headers : Map[String, String], sync : Boolean) : XMLHttpRequest = {
    val xhr = new dom.XMLHttpRequest()
    xhr.open(method, baseUrl + url, async = sync)
    (headers ++ defaultHeaders).foreach(t => xhr.setRequestHeader(t._1, t._2))
    xhr
  }

}