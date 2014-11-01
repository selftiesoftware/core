package com.siigna.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr

case object UnitExpr extends Expr

case class SeqExpr(expr: Expr*) extends Expr
case class LineExpr(e1: Expr, e2: Expr, e3: Expr, e4: Expr) extends Expr
case class ConstantExpr[A](value: A) extends Expr

trait ValExpr[A] extends Expr {
  val name: String
  val value: A
}

case class DoubleExpr(name: String, value: Double) extends ValExpr[Double]
case class IntExpr(name: String, value: Int) extends ValExpr[Int]
case class RefExpr(name: String) extends Expr
