package com.repocad.web.evaluating

import com.repocad.web.Printer
import com.repocad.web.evaluating.Evaluator
import com.repocad.web.lexing._
import com.repocad.web.parsing._
import org.scalatest.{FlatSpec, Matchers}

class ObjectTest extends FlatSpec with Matchers {

  val printer = new Printer[Any] {
    var latest = ""
    override def circle(x: Double, y: Double, r: Double): Unit = {}
    override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {}
    override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = latest = "line"
    override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {}
    override def text(x: Double, y: Double, h: Double, t: Any): Unit = {}

    override val context: Any = 1
    override protected def drawPaper(): Unit = ???
  }

  "An evaluator" should "parse an object expr" in {
    val objectExpr = ObjectExpr("object", Seq("a"))
    val x : Evaluator.Value = Evaluator.eval(objectExpr, printer)
    val env : Map[String, Any] = x.right.toOption.get._1
    assert(env.get("object").get.isInstanceOf[ObjectExpr])
  }
  it should "create an object" in {
    val env = Map("object" -> ObjectExpr("object", Seq("a")))
    val ref = RefExpr("object", Seq(ConstantExpr(1)))
    val expected = "object" -> Map("a" -> 1)
    Evaluator.eval(ref, env) should equal(Right(expected -> env.+(expected)))
  }
}
