package com.siigna.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr

case object UnitExpr extends Expr

case class CompExpr(e1 : Expr, e2 : Expr, op : String) extends Expr
case class OpExpr(e1 : Expr, e2 : Expr, op : String) extends Expr

case class LoopExpr(condition : Expr, body : Expr) extends Expr

case class SeqExpr(expr: Seq[Expr]) extends Expr
case class CircleExpr(centerX : Expr, centerY : Expr, radius : Expr) extends Expr
case class LineExpr(e1: Expr, e2: Expr, e3: Expr, e4: Expr) extends Expr
case class TextExpr(centerX : Expr, centerY : Expr, size : Expr) extends Expr

case class ConstantExpr[A](value: A) extends Expr
case class RefExpr(name: String) extends Expr
case class ValExpr(name: String, value: Expr) extends Expr
case class RangeExpr(name: String, from : Expr, to : Expr) extends Expr