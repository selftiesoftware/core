package com.repocad.web.parsing

import com.repocad.com.repocad.util.DirectedGraph
import com.repocad.web.lexing.Lexer
import com.repocad.web.{Environment, parsing}
import org.scalatest.{Matchers, FlatSpec}

trait ParsingTest extends FlatSpec with Matchers {

  val emptyTypeEnv : TypeEnv = new DirectedGraph(Map(), AnyType)

  def testEqualsAll(expected : Expr, expression : String) = {
    parseStringAll(expression).right.map(_._1) should equal(Right(expected))
  }

  def testEquals(expected : Expr, expression : String, valueEnv : ValueEnv = Environment.getParserEnv, typeEnv: TypeEnv = parsing.defaultTypeEnv) = {
    val either = parseString(expression, valueEnv, typeEnv).right.map(_._1)
    either should equal(Right(expected))
  }

  def parseString(string : String, valueEnv : ValueEnv = Environment.getParserEnv, typeEnv : TypeEnv = parsing.defaultTypeEnv) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }

  def parseStringAll(string : String) = {
    val stream = Lexer.lex(string)
    Parser.parse(stream)
  }

}
