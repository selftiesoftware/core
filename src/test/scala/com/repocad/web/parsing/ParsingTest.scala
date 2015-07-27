package com.repocad.web.parsing

import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing
import org.scalatest.{Matchers, FlatSpec}

trait ParsingTest extends FlatSpec with Matchers {

  def testEqualsAll(expected : Expr, expression : String) = {
    parseStringAll(expression).right.map(_._1) should equal(Right(expected))
  }

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, parsing.defaultValueEnv, parsing.defaultTypeEnv).right.map(_._1)
    either should equal(Right(expected))
  }

  def parseString(string : String, valueEnv : ValueEnv = parsing.defaultValueEnv, typeEnv : TypeEnv = parsing.defaultTypeEnv) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }

  def parseStringAll(string : String) = {
    val stream = Lexer.lex(string)
    Parser.parse(stream)
  }

}
