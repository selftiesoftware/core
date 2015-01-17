package com.siigna.web.parsing

import com.siigna.web.lexing._
import com.siigna.web.parsing.Parser.Value
import org.scalatest.{Matchers, FlatSpec}

class ParserTest extends FlatSpec with Matchers {

  val mockSuccess : (Expr, LiveStream[Token]) => Value = (e, s) => Right(e)
  val mockFailure : String => Value = s => Left(s)
  
  "A parser" should "parse a reference" in {
    val stream = LiveStream(Iterable[Token](SymbolToken("a"), PunctToken("}")))
    Parser.parseUntil(stream, PunctToken("}"), mockSuccess, mockFailure) should equal (Right(SeqExpr(Seq(RefExpr("a")))))
  }
  it should "parse an assignment " in {
    val stream = LiveStream(Iterable[Token](SymbolToken("a"), SymbolToken("="), IntToken(10), PunctToken("}")))
    Parser.parseUntil(stream, PunctToken("}"), mockSuccess, mockFailure) should equal (Right(SeqExpr(Seq(ValExpr("a", ConstantExpr(10))))))
  }
  it should "parse a line" in {
    val stream = Lexer.lex("line 0 0 10 10")
    Parser.parse(stream) should equal (Right(SeqExpr(Seq(LineExpr(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), ConstantExpr(10))))))
  }
  it should "parse a function" in {
    val stream = Lexer.lex("function a(b) { }")
    Parser.parse(stream) should equal(Right(SeqExpr(Seq(FunctionExpr("a", Seq("b"), SeqExpr(Seq()))))))
  }
  it should "parse a function with a body" in {
    val stream = Lexer.lex("function a(b) { c = 10 }")
    Parser.parse(stream) should equal(Right(SeqExpr(Seq(FunctionExpr("a", Seq("b"), SeqExpr(Seq(ValExpr("c", ConstantExpr(10)))))))))
  }
  it should "parse a block with a partial body" in {
    val stream = Lexer.lex("{ line 0 0 }")
    Parser.parse(stream) shouldBe a [Left[_, _]]
  }
  it should "not parse a partial line" in {
    val stream = Lexer.lex("line 0 10 ")
    Parser.parse(stream) shouldBe a [Left[_, _]]
  }

  "A parser until a symbol" should "parse an empty parameter block" in {
    val stream = LiveStream(Iterable[Token](SymbolToken(")")))
    Parser.parseUntil(stream, SymbolToken(")"), mockSuccess, mockFailure) should equal (Right(SeqExpr(Seq())))
  }
  it should "parse an empty scope block" in {
    val stream = LiveStream(Iterable[Token](SymbolToken("}")))
    Parser.parseUntil(stream, SymbolToken("}"), mockSuccess, mockFailure) should equal (Right(SeqExpr(Seq())))
  }



}
