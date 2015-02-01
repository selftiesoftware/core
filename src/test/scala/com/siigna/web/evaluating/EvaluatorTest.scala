package com.repocad.web.evaluating

import com.repocad.web.Printer
import com.repocad.web.lexing._
import com.repocad.web.parsing._
import org.scalatest.{FlatSpec, Matchers}

class EvaluatorTest extends FlatSpec with Matchers {

  val printer = new Printer {
    var latest = ""
    override def text(x: Double, y: Double, h: Double, t: Any): Unit = {}
    override def circle(x: Double, y: Double, r: Double): Unit = {}
    override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {}
    override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = latest = "line"
    override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {}
    override def textBox(x: Double, y: Double, w: Double, h: Double, t: Any): Unit = ???
  }

  "An evaluator" should "parse a function" in {
    val fun = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), RefExpr("b"))))
    val x : Evaluator.Value = Evaluator.eval(fun, printer)
    val env : Map[String, Any] = x.right.toOption.get._1
    assert(env.get("a").get.isInstanceOf[Function2[Printer, Any,Any]])
  }
  it should "parse a function into a runnable" in {
    val funExpr = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0d), ConstantExpr(0d), ConstantExpr(10d), RefExpr("b"))))
    val fun : Function2[Printer, Any, Any] = Evaluator.eval(funExpr, printer.toEnv, printer).right.toOption.get._2.asInstanceOf[Function2[Printer, Any, Any]]
    fun.apply(printer, 10d)
    assert(printer.latest == "line")
  }
  it should "evaluate a function call" in {
    val fun = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0d), ConstantExpr(0d), ConstantExpr(10d), RefExpr("b"))))
    val call = RefExpr("a", Seq(ConstantExpr(10d)))
    val seq = SeqExpr(Seq(fun, call))
    Evaluator.eval(seq, printer.toEnv, printer)
    assert(printer.latest == "line")
  }
  it should "return a value from a function" in {
    val expr = Parser.parse(Lexer.lex("function a() { 3 } a()")).right.get
    Evaluator.eval(expr, printer).right.get._2 should equal(3)
  }
}
