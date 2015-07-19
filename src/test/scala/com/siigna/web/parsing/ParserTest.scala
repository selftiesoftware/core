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

  "Assignment parsing" should "parse a definition" in {
    testEquals(DefExpr("a", StringExpr("hi")), "def a = \"hi\"")
  }
  it should "store a value in the value environment" in {
    parseString("def a = 10") should equal (Right(DefExpr("a", IntExpr(10)), Map("a" -> IntExpr(10)), Map[String, Type]()))
  }
  it should "parse a function with no parameters" in {
    testEquals(FunctionExpr("a", Seq(), BlockExpr(Seq())), "def a() = {}")
  }
  it should "parse a function with one parameter" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType)), BlockExpr(Seq())), "def a(b) = {}")
  }
  it should "parse a function with one typed parameter" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType)), BlockExpr(Seq())), "def a(b : Int) = {}")
  }
  it should "parse a function with two parameters" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType), RefExpr("c", StringType)), BlockExpr(Seq())), "def a(b c) = {}")
  }
  it should "parse a function with two typed parameters" in {
    testEquals(FunctionExpr("a", Seq(RefExpr("b", IntType), RefExpr("c", StringType)), BlockExpr(Seq())), "def a(b : Int c : String) = {}")
  }

  "Type inference" should "infer a type" in {
    testEquals(DefExpr("a", IntExpr(1)), "def a = 1")
  }
  it should "allow specification of type" in {
    testEquals(DefExpr("a", IntExpr(1)), "def a : Int = 1")
  }
  it should "fail when wrong type is specified" in {
    parseString("def a : Unit = 1").isLeft should equal (true)
  }

  "Value parsing" should "parse an integer" in {
    testEquals(IntExpr(1), "1")
  }
  it should "parse a string" in {
    testEquals(StringExpr("string"), "\"string\"")
  }
  it should "parse a double" in {
    testEquals(DoubleExpr(123.42), "123.42")
  }
  it should "parse a boolean" in {
    testEquals(BooleanExpr(value = true), "true")
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
