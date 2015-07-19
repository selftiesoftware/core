package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing.{ObjectExpr, Parser}
import com.repocad.web.parsing.Parser.Value
import org.scalatest.{FlatSpec, Matchers}

class ObjectTest extends FlatSpec with Matchers {

  def parseString(string : String) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, (t, _) => Right(t), f => Left(f))
  }

  "A parser" should "define an object" in {
    parseString("def object(a)") should equal(Right(ObjectExpr("object", Seq("a"))))
  }
  it should "fail when defining an object without parameters" in {
    parseString("def object()") should equal (Left(com.repocad.web.parsing.Error.EXPECTED_PARAMETERS(SeqExpr(Seq()).toString)))
  }

}
