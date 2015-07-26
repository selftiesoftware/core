package com.repocad.util

import com.repocad.com.repocad.util.{DirectedGraph, Node}
import com.repocad.web.parsing._
import org.scalatest.{FlatSpec, Matchers}

class DirectedGraphTest extends FlatSpec with Matchers {

  /* Values */
  "A directed graph" should "add a root" in {
    DirectedGraph[Type](AnyType) should equal(new DirectedGraph[Type](Map(AnyType -> Node(1, None)), AnyType))
  }
  it should "add a union" in {
    DirectedGraph[Type](AnyType).union(AnyType, NumberType) should equal(new DirectedGraph[Type](Map(AnyType -> Node(1, None), NumberType -> Node(2, Some(AnyType))), AnyType))
  }
  it should "fail when unioning non-existing parent" in {
    intercept[NoSuchElementException] {
      DirectedGraph[Type](AnyType).union(NumberType, IntType)
    }
  }

  it should "find a common parent in a linear hiearachy" in {
    val graph = DirectedGraph[Type](AnyType).union(AnyType, NumberType).union(NumberType, IntType)
    graph.commonParent(NumberType, IntType) should equal(NumberType)
  }
  it should "find a common parent in a split hierarchy" in {
    val graph = DirectedGraph[Type](AnyType).union(AnyType, NumberType).union(AnyType, BooleanType)
    graph.commonParent(NumberType, BooleanType) should equal(AnyType)
  }
  it should "return the same object when searching for a common parent to the same object" in {
    val graph = DirectedGraph[Type](AnyType).union(AnyType, NumberType).union(AnyType, BooleanType)
    graph.commonParent(AnyType, AnyType) should equal(AnyType)
  }

}
