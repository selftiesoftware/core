package com.repocad.web

import com.repocad.remote.{Post, HttpMethod, HttpClient, Response}
import org.scalajs.dom
import org.scalajs.dom.{Event, XMLHttpRequest}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Future, Promise}

/**
  * An implementation of a [[HttpClient]].
  */
object Ajax extends HttpClient {

  val baseUrl = "https://api.repocad.com/"

  private val defaultHeaders = Map("Access-Control-Allow-Origin" -> "*")

  def apply[T](url: String, method: HttpMethod, headers: Map[String, String], f: Response => T): Future[T] = {
    val xhr = createRequest(url, method, headers, sync = true)
    val promise = Promise[T]()

    xhr.onreadystatechange = (e: Event) => {
      if (xhr.readyState == 4) {
        promise.success(f(Response(xhr.status, xhr.readyState, xhr.responseText)))
      }
    }

    method match {
      case post: Post =>
        xhr.send(post.data)
      case _ =>
    }

    promise.future
  }

  private def createRequest(url: String, method: HttpMethod, headers: Map[String, String], sync: Boolean): XMLHttpRequest = {
    val xhr = new dom.XMLHttpRequest()
    xhr.open(method.method, baseUrl + url, async = sync)
    (headers ++ defaultHeaders).foreach(t => xhr.setRequestHeader(t._1, t._2))
    xhr
  }

}