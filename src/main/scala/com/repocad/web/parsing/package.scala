package com.repocad.web

import com.repocad.com.repocad.util.DirectedGraph
import com.repocad.web.lexing.{Token, LiveStream}

/**
 * The parsing package contains code for converting [[com.repocad.web.lexing.Token]]s into an Abstract Syntax Tree
 * (AST), which is a tree structure with an [[com.repocad.web.parsing.Expr]] as the only root.
 */
package object parsing {

  type TypeEnv = DirectedGraph[Type]
  type ValueEnv = Map[String, Expr]

  type Value = Either[String, (Expr, ValueEnv, TypeEnv)]

  type FailureCont = String => Value
  type SuccessCont = (Expr, ValueEnv, TypeEnv, LiveStream[Token]) => Value

  object Error {
    def EXPECTED_PARAMETERS(actual : String) : String = s"Expected parameter list when creating a function or object, but received '$actual'"

    def EXPECTED_TYPE_PARAMETERS(name : String) : String = s"No type information for variable $name; please specify its type using '$name as [Type]'"

    def FUNCTION_NOT_FOUND(functionName: String): String = s"Function '$functionName' not found"

    def OBJECT_MISSING_PARAMETERS(name : String) = s"Object '$name' must have at least one parameter"

    def REFERENCE_NOT_FOUND(reference : String) = s"Could not find object '$reference'. Has it been defined?"

    def SYNTAX_ERROR(expected : String, actual : String) = s"Syntax error: Expected '$expected', but found '$actual'"

    def TYPE_MISMATCH(expected : String, actual : String) = s"Type mismatch: Expected $expected, but got $actual"
    def TYPE_NOT_FOUND(typeName : String) : String = s"Type '$typeName' not found in scope. Is it defined above?"
  }

  val defaultValueEnv : ValueEnv = Map()

  val defaultTypeEnv : TypeEnv = DirectedGraph[Type](AnyType)
    /* Primitives */
    .union(BooleanType, AnyType)
    .union(StringType, AnyType)
    .union(UnitType, AnyType)
    /* Numbers */
    .union(NumberType, AnyType)
      .union(IntType, NumberType)
      .union(FloatType, NumberType)
    /* Functions */
    .union(FunctionType, AnyType)
      .union(Function1Type, AnyType)
      .union(Function2Type, AnyType)
      .union(Function3Type, AnyType)
      .union(Function4Type, AnyType)

  val stringTypeMap : Map[String, Type] = Map(
    "Boolean" -> BooleanType,
    "Float" -> FloatType,
    "Int" -> IntType,
    "String" -> StringType,
    "Unit" -> UnitType
  )

}
