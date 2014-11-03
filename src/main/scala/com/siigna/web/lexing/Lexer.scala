package com.siigna.web.lexing

/*
 SXLexer: A lexer for the programming language Scheme

 Author: Matthew Might
 Site:   http://matt.might.net/

 */
class Lexer extends NonblockingLexer[Char, Token] {

  import RegularLanguageImplicits._

  implicit def charsToString(l : List[Char]) : String = l.mkString

  // Abbreviations:
  private val ch = "#\\" ~ AnyChar
  private val id = (('A' thru 'Z') || ('a' thru 'z') || ('0' thru '9') || oneOf("-+/*_?%$#&^=!@<>:")).+
  private val int = ("-"?) ~ ('0' thru '9').+
  private val ws = oneOf(" \r\t\n").+ // whitespace
  private val com = "\\\\" ~ ((!oneOf("\r\n"))*) // single-line comment

  // States:
  protected val MAIN       = State()
  private val MULTICOMMENT = State(0)
  private val STRING       = State[List[Char]](List())

  // Rules:

  // State switching rules
  MAIN switchesOn "/*" to { MULTICOMMENT(1) }
  MAIN switchesOn "\"" to { STRING(List()) }

  // Regular tokens
  MAIN (",@")  { emit(PunctToken(",@")) }
  MAIN (",")   { emit(PunctToken(",")) }
  MAIN ("`")   { emit(PunctToken("`")) }
  MAIN ("'")   { emit(PunctToken("'")) }
  MAIN ("#(")  { emit(PunctToken("#(")) }
  MAIN ("(")   { emit(PunctToken("(")) }
  MAIN (")")   { emit(PunctToken(")")) }
  MAIN ("[")   { emit(PunctToken("[")) }
  MAIN ("]")   { emit(PunctToken("]")) }
  MAIN ("{")   { emit(PunctToken("{")) }
  MAIN ("}")   { emit(PunctToken("}")) }
  MAIN (".")   { emit(PunctToken(".")) }
  MAIN ("#t")  { emit(BooleanToken(b = true)) }
  MAIN ("#f")  { emit(BooleanToken(b = false)) }
  MAIN (END)   { terminate() }
  MAIN (ws)    { }
  MAIN (com)   { }
  MAIN (ch)    over { chars => emit(CharToken(chars(2))) }
  MAIN (int)   over { chars => emit(IntToken(Integer.parseInt(chars))) }
  MAIN (id)    over { chars => emit(SymbolToken(chars)) }

  // Strings
  STRING ("\"")    = { (string : List[Char], _ : List[Char])     => { emit(StringToken(string.reverse.mkString)) ; MAIN } }
  STRING ("\\\"")  = { (string : List[Char], chars : List[Char]) => STRING('"' :: string) }
  STRING ("\\n")   = { (string : List[Char], chars : List[Char]) => STRING('\n' :: string) }
  STRING ("\\\\")  = { (string : List[Char], chars : List[Char]) => STRING('\\' :: string) }
  STRING (AnyChar) = { (string : List[Char], chars : List[Char]) => STRING(chars.reverse ++ string) }

  // #! ... !# comments
  MULTICOMMENT ("/*")    = { (n : Int, chars : List[Char]) => MULTICOMMENT(n+1) }
  MULTICOMMENT (AnyChar)   { }
  MULTICOMMENT ("*/")    = { case (1,chars) => MAIN
  case (n : Int, chars) => MULTICOMMENT(n - 1) }

}

