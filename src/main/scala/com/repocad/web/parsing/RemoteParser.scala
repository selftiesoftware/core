package com.repocad.web.parsing

import com.repocad.web.lexing.Lexer
import com.repocad.web.{Response, Ajax}

/**
 * A parser that caches remote scripts.
 */
object RemoteParser {

  private var scriptCache : Map[String, Parser.Value] = Map()

  def get(scriptName : String) : Parser.Value = {
      scriptCache.getOrElse(scriptName, download(scriptName))
  }

  private def download(scriptName : String) : Parser.Value = {
    val value = Ajax.get("http://repocad.com/get/" + scriptName) match {
      case Response(_, 4, text) =>
        Parser.parse(Lexer.lex(text))
      case xs => Left(s"Script $scriptName failed to load with error: $xs")
    }
    scriptCache += (scriptName -> value)
    value
  }

}
