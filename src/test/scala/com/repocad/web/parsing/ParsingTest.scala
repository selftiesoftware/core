package com.repocad.web.parsing

import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing
import org.scalatest.{Matchers, FlatSpec}

trait ParsingTest extends FlatSpec with Matchers{

  val mockSuccess : SuccessCont = (e, v, t, s) => Right(e, v, t)
  val mockFailure : FailureCont = s => Left(s)

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, parsing.defaultValueEnv, parsing.defaultTypeEnv).right.map(_._1)
    println("output: ", either)
    either should equal(Right(expected))
  }

  def parseString(string : String, valueEnv : ValueEnv = parsing.defaultValueEnv, typeEnv : TypeEnv = parsing.defaultTypeEnv) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }

}
