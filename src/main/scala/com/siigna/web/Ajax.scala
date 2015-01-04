package com.siigna.web

import org.scalajs.dom

/**
 * A synchronous ajax object
 */
object Ajax {

  def apply(url : String, method : String = "GET") : Either[String, String] = {
    val xhr = new dom.XMLHttpRequest()
    xhr.open(method, url, async = false) // Handle synchronously
    xhr.send()
    if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
      Right(xhr.responseText)
    } else {
      Left(s"Failed to get resource $url with code ${xhr.status} and error ${xhr.responseText}")
    }
  }

}
