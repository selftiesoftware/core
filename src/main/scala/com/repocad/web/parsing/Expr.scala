package com.repocad.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr {
  /**
   * The inherent type of this expression.
   */
  val t: AnyType
}

case class BlockExpr(expr: Seq[Expr]) extends Expr { val t = if (expr.isEmpty) UnitType else expr.last.t }
case class CallExpr(name: String, t : AnyType, params: Seq[Expr]) extends Expr
case class DefExpr(name: String, value : Expr) extends Expr { val t = value.t }
case class FunctionExpr(name : String, params : Seq[RefExpr], body : Expr) extends Expr { val t = body.t }
case class RefExpr(name: String, t : AnyType) extends Expr
case object UnitExpr extends Expr { val t = UnitType }

trait ControlExpr extends Expr
case class ImportExpr(name : String) extends ControlExpr { val t = UnitType }
case class IfExpr(condition : Expr, ifBody : Expr, elseExpr : Expr, t : AnyType) extends ControlExpr
case class LoopExpr(loopCounter : DefExpr, loopEnd : Expr, body : Expr) extends ControlExpr { val t = CollectionType(body.t) }

trait ValueExpr[T] extends Expr { val value : T }
case class BooleanExpr(value : Boolean) extends ValueExpr[Boolean] { val t = BooleanType }
case class StringExpr(value : String) extends ValueExpr[String] { val t = StringType }
trait NumberExpr[T] extends ValueExpr[T]
case class FloatExpr(value : Double) extends NumberExpr[Double] { val t = FloatType }
case class IntExpr(value : Int) extends NumberExpr[Int] { val t = IntType }
