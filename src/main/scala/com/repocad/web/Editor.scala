package com.repocad.web

import com.repocad.reposcript.parsing.Expr
import com.thoughtworks.binding.Binding
import com.thoughtworks.binding.Binding.Var

/**
  * An editor that can generate different versions of an Abstract Syntax Tree (AST) containing parsed
  * [[com.repocad.reposcript.parsing.Expr]]s. The AST is published in the form of a [[Binding]], which can be
  * watched
  */
trait Editor {

  /**
    * The [[Drawing]] currently attached to the editor
    */
  val drawing: Var[Drawing]

}
