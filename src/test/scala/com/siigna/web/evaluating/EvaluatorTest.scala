package com.repocad.web.evaluating

import com.repocad.web.Printer
import com.repocad.web.lexing._
import com.repocad.web.parsing._
import com.repocad.web.parsing.Parser.Value
import org.scalatest.{FlatSpec, Matchers}

class EvaluatorTest extends FlatSpec with Matchers {

  val printer = new Printer {
    var latest = ""
    override def text(x: Double, y: Double, h: Double, t: Any): Unit = {}
    override def circle(x: Double, y: Double, r: Double): Unit = {}
    override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {}
    override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = latest = "line"
    override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {}
  }

  "An evaluator" should "parse a function" in {
    val fun = FunctionExpr("a", Seq("b"), LineExpr(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), RefExpr("b")))
    val x : Evaluator.Value = Evaluator.eval(fun, Map(), printer)
    val env : Map[String, Any] = x.right.toOption.get._1
    assert(env.get("a").get.isInstanceOf[Function1[Any,Any]])
  }
  it should "parse a function into a runnable" in {
    val funExpr = FunctionExpr("a", Seq("b"), LineExpr(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), RefExpr("b")))
    val fun : Function1[Any, Any] = Evaluator.eval(funExpr, Map(), printer).right.toOption.get._2.asInstanceOf[Function1[Any, Any]]
    fun.apply(10)
    assert(printer.latest == "line")
  }
  it should "evaluate a function call" in {
    val fun = FunctionExpr("a", Seq("b"), LineExpr(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), RefExpr("b")))
    val call = RefExpr("a", Seq(ConstantExpr(10)))
    val seq = SeqExpr(Seq(fun, call))
    Evaluator.eval(seq, Map(), printer)
    assert(printer.latest == "line")
  }
}
