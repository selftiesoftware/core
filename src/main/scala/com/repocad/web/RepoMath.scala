package com.repocad.web

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

}
