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
case class CompExpr(e1 : Expr, e2 : Expr, op : String) extends Expr { val t = BooleanType }
case class DefExpr(name: String, value : Expr) extends ValueExpr { val t = value.t }
case class FunctionExpr(name : String, params : Seq[RefExpr], body : Expr) extends Expr
{ val t = params.size match {
  case 1 => Function1Type
  case 2 => Function2Type
  case 3 => Function3Type
  case 4 => Function4Type
  case x => throw new IllegalArgumentException(s"No function with $x arguments exists")
} }
case class OpExpr(e1 : Expr, e2 : Expr, op : String, t : NumberType) extends Expr
case class RangeExpr(name: String, from : Expr, to : Expr, t : Type) extends Expr
case object UnitExpr extends Expr { val t = UnitType }
trait ControlExpr extends Expr

case class ImportExpr(name : String) extends ControlExpr { val t = UnitType }
case class IfExpr(condition : Expr, ifBody : Expr, elseExpr : Option[Expr], t : Type) extends ControlExpr
case class LoopExpr(condition : Expr, body : Expr, t : Type) extends ControlExpr

trait ValueExpr extends Expr
case class BooleanExpr(value : Boolean) extends ValueExpr { val t = BooleanType }
case class CallExpr(name: String, t : Type, params: Seq[Expr]) extends ValueExpr
case class FloatExpr(value : Double) extends ValueExpr { val t = FloatType }
case class IntExpr(value : Int) extends ValueExpr { val t = IntType }
case class RefExpr(name: String, t : Type) extends ValueExpr
case class StringExpr(value : String) extends ValueExpr { val t = StringType }
