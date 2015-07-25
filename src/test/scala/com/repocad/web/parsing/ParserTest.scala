package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing.Parser._
import org.scalatest.{Matchers, FlatSpec}
import org.scalatest.EitherValues._

class ParserTest extends FlatSpec with Matchers {

  val mockSuccess : SuccessCont = (e, v, t, s) => Right(e, v, t)
  val mockFailure : FailureCont = s => Left(s)

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, Map(), Type.typeEnv)
    println("output: ", either)
    either.right.value._1 should equal(expected)
  }

  def parseString(string : String, valueEnv : ValueEnv = Map(), typeEnv : TypeEnv = Map()) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }
  
  /*"A parser" should "parse a reference" in {
    val stream = LiveStream(Iterable[Token](SymbolToken("a"), PunctToken("}")))
    Parser.parseUntil(stream, PunctToken("}"), mockSuccess, mockFailure) should equal (Right(BlockExpr(Seq(RefExpr("a")))))
  }
  it should "parse an assignment " in {
    val stream = LiveStream(Iterable[Token](SymbolToken("a"), SymbolToken("="), IntToken(10), PunctToken("}")))
    Parser.parseUntil(stream, PunctToken("}"), mockSuccess, mockFailure) should equal (Right(BlockExpr(Seq(ValExpr("a", ConstantExpr(10))))))
  }
  it should "parse a line" in {
    val stream = Lexer.lex("line 0 0 10 10")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(RefExpr("line", Seq(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), ConstantExpr(10)))))))
  }
  it should "parse a function" in {
    val stream = Lexer.lex("function a(b) { }")
    Parser.parse(stream) should equal(Right(BlockExpr(Seq(FunctionExpr("a", Seq("b"), BlockExpr(Seq()))))))
  }
  it should "parse a function with a body" in {
    val stream = Lexer.lex("function a(b) { c = 10 }")
    Parser.parse(stream) should equal(Right(BlockExpr(Seq(FunctionExpr("a", Seq("b"), BlockExpr(Seq(ValExpr("c", ConstantExpr(10)))))))))
  }
  it should "parse a block with a partial body" in {
    val stream = Lexer.lex("{ line 0 0 }")
    Parser.parse(stream) shouldBe a [Left[_, _]]
  }
  it should "not parse a partial line" in {
    val stream = Lexer.lex("line 0 10 ")
    Parser.parse(stream) shouldBe a [Left[_, _]]
  }

  it should "parse text" in {
    val stream = Lexer.lex("text 0 0 10 \"Hello world\"")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(RefExpr("text", Seq(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), ConstantExpr("Hello world")))))))
  }

  it should "parse circles" in {
    val stream = Lexer.lex("circle 40 60 20")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(RefExpr("circle", Seq(ConstantExpr(40), ConstantExpr(60), ConstantExpr(20)))))))
  }

  it should "parse arcs" in {
    val stream = Lexer.lex("arc 100 60 20 2 4")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(RefExpr("arcs", Seq(ConstantExpr(100), ConstantExpr(60), ConstantExpr(20), ConstantExpr(2), ConstantExpr(4)))))))
  }

  it should "parse assignments" in {
    val stream = Lexer.lex("x1 = -90\ny1 = 90")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(ValExpr("x1", ConstantExpr(-90)), ValExpr("y1", ConstantExpr(90))))))
  }

  it should "parse assignments in expressions" in {
    val stream = Lexer.lex("x1 = -90\ny1 = 90\ncircle x1 + 40 y1 - 60 20 ")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(
      ValExpr("x1", ConstantExpr(-90)),
      ValExpr("y1", ConstantExpr(90)),
      RefExpr("circle", Seq(OpExpr(RefExpr("x1"), ConstantExpr(40), "+"), OpExpr(RefExpr("y1"), ConstantExpr(60), "-"), ConstantExpr(20)))
    ))))
  }

  it should "parse empty spaces as unit expr" in {
    val stream = Lexer.lex("text 0 0 10 \"Hello world\"  \n  ")
    Parser.parse(stream) should equal (Right(BlockExpr(Seq(RefExpr("text", Seq(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), ConstantExpr("Hello world")))))))
  }

  "A parser until a symbol" should "parse an empty parameter block" in {
    val stream = LiveStream(Iterable[Token](SymbolToken(")")))
    Parser.parseUntil(stream, SymbolToken(")"), mockSuccess, mockFailure) should equal (Right(BlockExpr(Seq())))
  }
  it should "parse an empty scope block" in {
    val stream = LiveStream(Iterable[Token](SymbolToken("}")))
    Parser.parseUntil(stream, SymbolToken("}"), mockSuccess, mockFailure) should equal (Right(BlockExpr(Seq())))
  }*/



}
