package com.repocad.web

/**
 * The parsing package contains code for converting [[com.repocad.web.lexing.Token]]s into an Abstract Syntax Tree
 * (AST), which is a tree structure with an [[com.repocad.web.parsing.Expr]] as the only root.
 */
package object parsing {

  object Error {
    def EXPECTED_PARAMETERS(actual : String) : String = s"Expected parameter list when creating a function or object, but received '$actual'"

    def EXPECTED_TYPE_PARAMETERS(name : String) : String = s"No type information for variable $name; please specify its type using '$name as [Type]'"

    def FUNCTION_NOT_FOUND(functionName: String): String = s"Function '$functionName' not found"

    def OBJECT_MISSING_PARAMETERS(name : String) = s"Object '$name' must have at least one parameter"

    def REFERENCE_NOT_FOUND(reference : String) = s"Could not find object '$reference'. Has it been defined?"

    def SYNTAX_ERROR(expected : String, actual : String) = s"Syntax error: Expected '$expected', but found '$actual'"

    def TYPE_MISMATCH(expected : String, actual : String) = s"Type mismatch: Expected $expected, but got $actual"
    def TYPE_NOT_FOUND(typeName : String) : String = s"Type '$typeName' not found"
  }

  val typeEnv : Map[String, Type] = Map(
    "Boolean" -> BooleanType,
    "Double" -> DoubleType,
    "Int" -> IntType,
    "String" -> StringType,
    "Unit" -> UnitType
  )

}
