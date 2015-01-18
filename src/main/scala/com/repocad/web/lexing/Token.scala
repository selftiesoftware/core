package com.repocad.web.lexing

import java.lang.{Object => TokenTag}


/**
Parsers consume live streams of tokens (or objects that can be implicitly converted into them).

 A token is an individual lexeme.

 (In terms of context-free grammars, tokens are the terminals.)
  */
trait Token extends Ordered[Token] {

  /**
  @return true iff this token represents a parsing marker.

   Parsing markers are special tokens that do not appear in input
   strings; they only appear in parse strings to indicate the
   structure of the parse.

    */
  def isParsingMarker : Boolean ;

  protected def localCompare(that : Token) : Int ;

  /**
  The class of this token.
    */
  lazy val `class` = this.getClass().toString()

  /**
  The tag of this token.

   A token's tag indicates to which lexical class to which it belongs.

   Tokens consumed as input should have strings for their tags.

   Examples of good tags would be, "Identifier", "Integer", "String", ";", "(", ")".

   Parsing markers will have special tags.
    */
  def tag : TokenTag ;

  def compare (thatToken : Token) : Int = {
    val c1 = this.`class` compare thatToken.`class`
    if (c1 != 0)
      return c1
    this.localCompare(thatToken)
  }
}

/**
Punctuation tokens.
  */
case class PunctToken(s : String) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case PunctToken(thatS) => s compare thatS
  }

  val tag = s

  override lazy val hashCode = s.hashCode
  override lazy val toString = "[" + s + "]"
}

/**
Symbol tokens.
  */
case class SymbolToken(s : String) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case SymbolToken(thatS) => s compare thatS
  }

  val tag = "Symbol"

  override lazy val hashCode = s.hashCode
  override lazy val toString = "'" + s
}

/**
String literal tokens.
  */
case class StringToken(s : String) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case StringToken(thatS) => s compare thatS
  }

  val tag = "String"

  override lazy val hashCode = s.hashCode
  override lazy val toString = "\"" + s + "\""
}

/**
Integer tokens.
  */
case class IntToken(n : Int) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case IntToken(thatN) => this.n compare thatN
  }

  val tag = "Int"

  override lazy val hashCode = n.hashCode
  override lazy val toString = n.toString
}

/**
Boolean literal tokens.
  */
case class BooleanToken(b : Boolean) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case BooleanToken(thatB) => this.b compare thatB
  }

  val tag = "Boolean"

  override lazy val hashCode = b.hashCode
  override lazy val toString = if (b) "#t" else "#f"
}

/**
Character tokens.
  */
case class CharToken(c : Char) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case CharToken(thatC) => this.c compare thatC
  }

  val tag = "Char"

  override lazy val hashCode = c.hashCode
  override lazy val toString = "'" + c + "'"
}

case class DoubleToken(d : Double) extends Token {
  def isParsingMarker = false

  protected def localCompare(that : Token) = that match {
    case DoubleToken(thatD) => this.d compare thatD
  }

  val tag = "Double"

  override lazy val hashCode = d.hashCode
  override lazy val toString = d.toString
}