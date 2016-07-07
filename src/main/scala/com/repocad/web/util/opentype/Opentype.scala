package com.repocad.web.util.opentype

import scala.concurrent.{Future, Promise}
import scala.scalajs.js

object Opentype {

  if (js.isUndefined(js.Dynamic.global.opentype)) {
    throw new RuntimeException("Opentype is not defined. Has it been imported?")
  }

  def load(url: String): Future[Font] = {
    val promise: Promise[Font] = Promise()
    js.Dynamic.global.opentype.load(url, (err: js.Dynamic, font: js.Dynamic) => {
      if (js.isUndefined(err)) {
        promise.success(font.asInstanceOf[Font])
      } else if (js.isUndefined(font)) {
        promise.failure(new RuntimeException(err.toString))
      } else {
        promise.failure(new RuntimeException("Expected font object but got " + font))
      }
    })
    promise.future
  }

}


