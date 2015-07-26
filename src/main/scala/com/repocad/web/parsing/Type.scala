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
case object FloatType extends NumberType
case object IntType extends NumberType

trait FunctionType extends Type
case object FunctionType extends FunctionType
case object Function1Type extends FunctionType
case object Function2Type extends FunctionType
case object Function3Type extends FunctionType
case object Function4Type extends FunctionType