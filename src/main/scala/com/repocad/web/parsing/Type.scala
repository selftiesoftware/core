package com.repocad.web.parsing

/**
 * The type from where all data types in RepoScript inherit.
 */
trait Type

case object AnyType extends Type

case object BooleanType extends Type
case object StringType extends Type
case object UnitType extends Type

trait NumberType extends Type
case object NumberType extends NumberType
case object DoubleType extends NumberType
case object IntType extends NumberType

case class FunctionType(params : Int) extends Type
