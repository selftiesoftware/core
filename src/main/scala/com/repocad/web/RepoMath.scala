package com.repocad.web

import com.repocad.reposcript.parsing.Expr

/**
 * An object that provides math functions to RepoScript
 */
object RepoMath {

  def divide(a : Any, b : Any) : Any = numberOp(a, b, (x, y) => x / y)
  def lessThan(a: Any, b: Any) : Any = numberOp(a, b, (x, y) => x < y)
  def lessThanEquals(a : Any, b : Any) : Any = numberOp(a, b, (x, y) => x <= y)
  def minus(a : Any, b : Any) : Any = numberOp(a, b, (x, y) => x - y)
  def plus(a : Any, b : Any) : Any = numberOp(a, b, (x, y) => x + y)
  def times(a : Any, b : Any) : Any = numberOp(a, b, (x, y) => x * y)

  private def numberOp[T](a : Any, b : Any, f : (Double, Double) => T) : T =
    (a, b) match {
      case (x : Int, y : Int) => f(x, y)
      case (x : Double, y : Int) => f(x, y)
      case (x : Int, y : Double) => f(x, y)
      case (x : Double, y : Double) => f(x, y)
    }

  //sort a list in the format editor.AST by X value (in order to get a sorted export output eg. in PDF files)
  //this is useful for cnc milling, engraving etc.
  def sortByX(ast : List[Expr]): Unit = {
    for(x <- ast ){
      println("AST EXPR:")
      println(x)
    }
    //return sorted list
  }

}
