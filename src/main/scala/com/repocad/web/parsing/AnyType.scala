package com.repocad.web.parsing

/**
 * The type from where all data types in RepoScript inherit.
 */
trait AnyType

case object AnyType extends AnyType

case class CollectionType(content : AnyType) extends AnyType

case object BooleanType extends AnyType
case object StringType extends AnyType
case object UnitType extends AnyType

trait NumberType extends AnyType
case object NumberType extends NumberType
case object FloatType extends NumberType
case object IntType extends NumberType

trait FunctionType extends AnyType
case object FunctionType extends FunctionType
case object Function1Type extends FunctionType
case object Function2Type extends FunctionType
case object Function3Type extends FunctionType
case object Function4Type extends FunctionType