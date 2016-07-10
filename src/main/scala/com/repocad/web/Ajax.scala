package com.repocad.web

import java.util.concurrent.TimeUnit

import com.repocad.remote.{HttpClient, HttpMethod, Post, Response}
import org.scalajs.dom
import org.scalajs.dom.{Event, XMLHttpRequest}

import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future, Promise}
import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue
import scala.util.Try


/**
  * An implementation of a [[HttpClient]].
  */
object Ajax extends HttpClient {

  val baseUrl = "https://api.repocad.com/"

  private val defaultHeaders = Map("Access-Control-Allow-Origin" -> "*")

  protected def httpCall[T](url: String, method: HttpMethod, headers: Map[String, String], f: Response => T): Future[T] = {
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

  /**
    * Waits for the result of the future.
    *
    * @param future The future containing a result at some point in time.
    * @return The result of the future.
    */
  override def result[T](future: Future[T]): Try[T] = {
    while (future.value.isEmpty) {
      // Do nothing
    }
    future.value.get
  }

}