//package com.repocad.printer
//
//import com.repocad.util.{BoundlessPaper, TransformationMatrix}
//
//import scala.collection.mutable
//
//class PsPrinter extends Printer[scala.collection.mutable.Seq[String], BoundlessPaper.type] {
//
//  implicit val transformation = TransformationMatrix().flipY()
//  val context = mutable.ListBuffer[String]()
//  val paper: BoundlessPaper.type = BoundlessPaper
//
//  override protected def drawPaper(): Unit = {}
//
//  override def prepare(): Unit = {
//    context.clear()
//  }
//
//  private object PsCommand {
//    def closePath = "h"
//
//    def lineTo(x: Double, y: Double)(implicit t: TransformationMatrix) = toCommand("l", x, y, t)
//
//    def moveTo(x: Double, y: Double)(implicit t: TransformationMatrix) = toCommand("m", x, y, t)
//
//    private def toCommand(command: String, x: Double, y: Double, t: TransformationMatrix) = {
//      toXY(x, y, t) + " " + command
//    }
//
//    private def toXY(x: Double, y: Double, t: TransformationMatrix): String = {
//      val transformedPoint = t.applyToPoint(x, y)
//      transformedPoint.x + " " + transformedPoint.y
//    }
//  }
//
//  override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {}
//
//  override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {}
//
//  override def circle(x: Double, y: Double, r: Double): Unit = {}
//
//  def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
//    context += PsCommand.moveTo(x1, y2)
//    context += PsCommand.lineTo(x2, y2)
//    context += PsCommand.closePath
//  }
//
//  override def text(x: Double, y: Double, h: Double, t: Any): Map[String, Any] = Map("x" -> 0, "y" -> 0)
//
//  override def text(x: Double, y: Double, h: Double, t: Any, font: String): Map[String, Any] = Map("x" -> 0, "y" -> 0)
//
//}
