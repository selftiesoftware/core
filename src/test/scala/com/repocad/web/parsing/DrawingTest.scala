package com.repocad.web.parsing

import com.repocad.web.{Printer, Environment}
import org.scalamock.scalatest.MockFactory

class DrawingTest extends ParsingTest with MockFactory {

  val mockPrinter : Printer[Any] = mock[Printer[Any]]
  val env = Environment.getParserEnv

  "A parser using default drawing environments" should "parse an arc call" in {
    parseString("arc(1 2 3 4 5)", env).right.get._1 should equal (CallExpr("arc", UnitType, Seq(IntExpr(1), IntExpr(2), IntExpr(3), IntExpr(4), IntExpr(5))))
  }
  it should "parse a bezier curve call" in {
    parseString("bezier(1 1 2 2 3 3 4 4)", env).right.get._1 should equal (CallExpr("bezier", UnitType, Seq(IntExpr(1), IntExpr(1), IntExpr(2), IntExpr(2), IntExpr(3), IntExpr(3), IntExpr(4), IntExpr(4))))
  }
  it should "parse a circle call" in {
    parseString("circle(1 2 3)", env).right.get._1 should equal (CallExpr("circle", UnitType, Seq(IntExpr(1), IntExpr(2), IntExpr(3))))
  }
  it should "parse a line call" in {
    parseString("line(1 2 3 4)", env).right.get._1 should equal (CallExpr("line", UnitType, Seq(IntExpr(1), IntExpr(2), IntExpr(3), IntExpr(4))))
  }
  it should "parse a text call" in {
    parseString("text(1 2 3 \"hello\")", env).right.get._1 should equal (CallExpr("text", UnitType, Seq(IntExpr(1), IntExpr(2), IntExpr(3), StringExpr("hello"))))
  }

}
