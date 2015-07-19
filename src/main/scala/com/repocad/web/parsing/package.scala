package com.repocad.web

/**
 * The parsing package contains code for converting [[com.repocad.web.lexing.Token]]s into an Abstract Syntax Tree
 * (AST), which is a tree structure with an [[com.repocad.web.parsing.Expr]] as the only root.
 */
package object parsing {

  object Error {
    def FUNCTION_NOT_FOUND(functionName: String): String = s"Function '$functionName' not found"
    def TYPE_NOT_FOUND(typeName : String) : String = s"Type '$typeName' not found"
  }

}
