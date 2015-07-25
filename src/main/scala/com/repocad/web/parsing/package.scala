package com.repocad.web

/**
 * The parsing package contains code for converting [[com.repocad.web.lexing.Token]]s into an Abstract Syntax Tree
 * (AST), which is a tree structure with an [[com.repocad.web.parsing.Expr]] as the only root.
 */
package object parsing {

  object Error {
    def EXPECTED_PARAMETERS(actual : String) : String = s"Expected parameter list when creating a function or object, but received '$actual'"
    def EXPECTED_TYPE_PARAMETERS(name : String) : String = s"No type information for variable $name; please specify type using '$name as [Type]'"

    def FUNCTION_NOT_FOUND(functionName: String): String = s"Function '$functionName' not found"

    def OBJECT_MISSING_PARAMETERS(name : String) = s"Object '$name' must have at least one parameter"

    def TYPE_NOT_FOUND(typeName : String) : String = s"Type '$typeName' not found"
  }

}
