package com.repocad.web.evaluating

import org.scalatest.{FlatSpec, Matchers}

import com.repocad.web.Printer

class EvaluatorTest extends FlatSpec with Matchers {

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

}
