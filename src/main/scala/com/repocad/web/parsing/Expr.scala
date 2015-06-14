package com.repocad.web.parsing

/**
 * An expression that contains information about an isolated instruction.
 */
trait Expr {
val t: Type
}

case class BlockExpr(expr: Seq[Expr], t : Type) extends Expr
case class CompExpr(e1 : Expr, e : Expr, op : String) extends Expr { val t = BooleanType }
case class FunctionExpr[T](name : String, params : Map[String, Type], body : Expr, t : Type) extends Expr
case class RangeExpr(name: String, from : Expr, to : Expr, t : Type) extends Expr
case object UnitExpr extends Expr { val t = UnitType }

trait ControlExpr extends Expr
case class ImportExpr(name : String) extends ControlExpr { val t = UnitType }
case class IfExpr(condition : Expr, ifBody : Expr, elseExpr : Option[Expr], t : Type) extends ControlExpr
case class LoopExpr(condition : Expr, body : Expr, t : Type) extends ControlExpr

trait ValueExpr extends Expr
case class DefExpr(name: String, value : Expr, t : Type) extends ValueExpr
case class RefExpr(name: String, t : Type, params : Seq[Expr]*) extends ValueExpr
case class BooleanExpr(value : Boolean) extends ValueExpr { val t = BooleanType }
case class DoubleExpr(value : Double) extends ValueExpr { val t = DoubleType }
case class IntExpr(value : Int) extends ValueExpr { val t = IntType }
case class StringExpr(value : String) extends ValueExpr { val t = StringType }

/**
 * The type from where all data types in RepoScript inherit.
 */
trait Type
case object BooleanType extends Type
case object DoubleType extends Type
case object IntType extends Type
case object StringType extends Type
case object UnitType extends Type

object Type {

  def fromName(name : String) : Either[String, Type] = name match {
    case "Boolean" => Right(BooleanType)
    case "Double" => Right(DoubleType)
    case "Int" => Right(IntType)
    case "String" => Right(StringType)
    case "Unit" => Right(UnitType)
    case _ => Left(s"No type found of name $name")
  }

}
