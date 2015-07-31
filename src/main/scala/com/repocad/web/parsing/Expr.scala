package com.repocad.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr {
  /**
   * The inherent type of this expression.
   */
  val t: Type
}

case class BlockExpr(expr: Seq[Expr]) extends Expr { val t = if (expr.isEmpty) UnitType else expr.last.t }
case class CallExpr(name: String, t : Type, params: Seq[Expr]) extends Expr
case class DefExpr(name: String, value : Expr) extends Expr { val t = value.t }
case class FunctionExpr(name : String, params : Seq[RefExpr], body : Expr) extends Expr { val t = body.t }
case class OpExpr(e1 : Expr, e2 : Expr, op : String, t : Type) extends Expr
case class RefExpr(name: String, t : Type) extends Expr
case object UnitExpr extends Expr { val t = UnitType }

trait ControlExpr extends Expr
case class ImportExpr(name : String) extends ControlExpr { val t = UnitType }
case class IfExpr(condition : Expr, ifBody : Expr, elseExpr : Option[Expr], t : Type) extends ControlExpr
case class LoopExpr(condition : Expr, body : Expr, t : Type) extends ControlExpr

trait ValueExpr[T] extends Expr { val value : T }
case class BooleanExpr(value : Boolean) extends ValueExpr[Boolean] { val t = BooleanType }
case class FloatExpr(value : Double) extends ValueExpr[Double] { val t = FloatType }
case class IntExpr(value : Int) extends ValueExpr[Int] { val t = IntType }
case class StringExpr(value : String) extends ValueExpr[String] { val t = StringType }
