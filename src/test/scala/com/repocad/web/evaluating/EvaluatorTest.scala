package com.repocad.web.evaluating

import org.scalatest.{FlatSpec, Matchers}

class EvaluatorTest extends FlatSpec with Matchers {

<<<<<<< HEAD:src/test/scala/com/siigna/web/evaluating/EvaluatorTest.scala
  /*
  val printer = new Printer {
=======
  val printer = new Printer[Any] {
>>>>>>> master:src/test/scala/com/repocad/web/evaluating/EvaluatorTest.scala
    var latest = ""
    override def circle(x: Double, y: Double, r: Double): Unit = {}
    override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {}
    override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = latest = "line"
    override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {}
<<<<<<< HEAD:src/test/scala/com/siigna/web/evaluating/EvaluatorTest.scala
    override def textBox(x: Double, y: Double, w: Double, h: Double, t: Any): Unit = ???

=======
    override def text(x: Double, y: Double, h: Double, t: Any): Unit = {}

    override val context: Any = 1
    override protected def drawPaper(): Unit = ???
>>>>>>> master:src/test/scala/com/repocad/web/evaluating/EvaluatorTest.scala
  }

  "An evaluator" should "parse a function" in {
    val fun = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0), ConstantExpr(0), ConstantExpr(10), RefExpr("b"))))
    val x : Evaluator.Value = Evaluator.eval(fun, printer)
    val env : Map[String, Any] = x.right.toOption.get._1
    assert(env.get("a").get.isInstanceOf[Function2[Printer[Any], Any,Any]])
  }
  it should "parse a function into a runnable" in {
    val funExpr = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0d), ConstantExpr(0d), ConstantExpr(10d), RefExpr("b"))))
    val fun : Function2[Printer[Any], Any, Any] = Evaluator.eval(funExpr, printer.toEnv).right.toOption.get._2.asInstanceOf[Function2[Any, Any, Any]]
    fun.apply(printer, 10d)
    assert(printer.latest == "line")
  }
  it should "evaluate a function call" in {
    val fun = FunctionExpr("a", Seq("b"), RefExpr("line", Seq(ConstantExpr(0d), ConstantExpr(0d), ConstantExpr(10d), RefExpr("b"))))
    val call = RefExpr("a", Seq(ConstantExpr(10d)))
<<<<<<< HEAD:src/test/scala/com/siigna/web/evaluating/EvaluatorTest.scala
    val seq = BlockExpr(Seq(fun, call))
    Evaluator.eval(seq, printer.toEnv, printer)
=======
    val seq = SeqExpr(Seq(fun, call))
    Evaluator.eval(seq, printer.toEnv)
>>>>>>> master:src/test/scala/com/repocad/web/evaluating/EvaluatorTest.scala
    assert(printer.latest == "line")
  }
  it should "return a value from a function" in {
    val expr = Parser.parse(Lexer.lex("function a() { 3 } a()")).right.get
    Evaluator.eval(expr, printer).right.get._2 should equal(3)
  }
  */
}
