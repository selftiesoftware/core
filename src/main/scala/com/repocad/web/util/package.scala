package com.repocad.web

import scala.scalajs.js

/**
  * Utility for web.
  */
package object util {

  def isAndroid: Boolean = {
    try {
      js.Dynamic.global.navigator.appVersion.indexOf("Android").asInstanceOf[Int] >= 0
    } catch {
      case e: Exception => false
    }
  }

}
