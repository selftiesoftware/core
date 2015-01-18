package com.repocad.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr

case object UnitExpr extends Expr

case class ImportExpr(name : RefExpr) extends Expr

case class CompExpr(e1 : Expr, e2 : Expr, op : String) extends Expr
case class OpExpr(e1 : Expr, e2 : Expr, op : String) extends Expr

case class FunctionExpr(name : String, params : Seq[String], body : Expr) extends Expr
case class LoopExpr(condition : Expr, body : Expr) extends Expr

case class SeqExpr(expr: Seq[Expr]) extends Expr
case class ArcExpr(centerX : Expr, centerY : Expr, radius : Expr, sAngle : Expr, eAngle : Expr) extends Expr
case class BezierExpr(x1 : Expr, y1 : Expr, x2 : Expr, y2 : Expr, x3 : Expr, y3 : Expr, x4 : Expr, y4 : Expr) extends Expr
case class CircleExpr(centerX : Expr, centerY : Expr, radius : Expr) extends Expr
case class LineExpr(e1: Expr, e2: Expr, e3: Expr, e4: Expr) extends Expr
case class TextExpr(centerX : Expr, centerY : Expr, size : Expr, t : Expr) extends Expr

trait ValueExpr extends Expr
case class ConstantExpr[A](value: A) extends ValueExpr
case class RefExpr(name: String, params : Seq[Expr]*) extends ValueExpr
case class ValExpr(name: String, value: Expr) extends ValueExpr
case class RangeExpr(name: String, from : Expr, to : Expr) extends ValueExpr
