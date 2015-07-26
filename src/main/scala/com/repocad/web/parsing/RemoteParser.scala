package com.repocad.web.parsing

import com.repocad.web.lexing.Lexer
import com.repocad.web.{Response, Ajax}

/**
 * A parser that caches remote scripts.
 */
object RemoteParser {

  private var scriptCache : Map[String, Value] = Map()

  def get(scriptName : String) : Value = {
      scriptCache.getOrElse(scriptName, download(scriptName))
  }

  private def download(scriptName : String) : Value = {
    val value = Ajax.get("http://repocad.com/get/" + scriptName) match {
      case Response(_, 4, text) =>
        Parser.parse(Lexer.lex(text))
      case xs => Left(s"Script $scriptName failed to load with error: $xs")
    }
    scriptCache += (scriptName -> value)
    value
  }

}
