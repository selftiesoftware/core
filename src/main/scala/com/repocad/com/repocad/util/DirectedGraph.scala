package com.repocad.com.repocad.util

import com.repocad.com.repocad.util.DirectedGraph.Node

import scala.collection.immutable

/**
 * An immutable directed graph with a single root, optimised to find common ancestry between two elements.
 * @param nodes The nodes of the graph.
 * @param root The root key to the root node of the graph.
 */
final case class DirectedGraph[T](nodes : immutable.Map[T, Node[T]], root : T) {

  /**
   * Finds the common parent of the two nodes. If the nodes are identical, the first node is returned immediately. This
   * operation is at worst {{{O(2 * k)}}}, where `k` is the height of the tree.
   * @param first The first element to start searching from.
   * @param second The second element to start searching from.
   * @return A common ancestor
   */
  def commonParent(first : T, second : T) : T = {
    if (first.equals(second)) {
      first
    } else if (first.equals(root) || second.equals(root)) {
      root
    } else {
      (nodes.get(first), nodes.get(second)) match {
        case (Some(firstNode), Some(secondNode)) =>
          if (firstNode.level <= secondNode.level) {
            commonParent(first, secondNode.parent.get)
          } else {
            commonParent(firstNode.parent.get, second)
          }
        case (None, Some(_)) => throw new NoSuchElementException(first.toString)
        case (Some(_), None) => throw new NoSuchElementException(second.toString)
        case (None, None) => throw new NoSuchElementException(s"$first and $second")
      }
    }
  }

  def exists(element : T) = nodes.contains(element)

  def getChildOf(parent : T, child : T) : Option[T] = {
    getChildOf(parent -> nodes(parent), child -> nodes(child))
  }

  private def getChildOf(parent : (T, Node[T]), child : (T, Node[T])) : Option[T] = {
    if (parent.equals(child)) {
      Some(parent._1)
    } else if (parent._2.level < child._2.level) {
      val childParent = child._2.parent.get
      getChildOf(parent, childParent -> nodes(childParent))
    } else {
      None
    }
  }

  def union(parent : T, child : T) : DirectedGraph[T] = nodes.get(parent) match {
    case Some(parentNode) => new DirectedGraph[T](nodes.+(child -> Node(parentNode.level + 1, Some(parent))), root)
    case None => throw new NoSuchElementException(s"No element found for $parent")
  }

}

/**
 * A helper object that can generate [[DirectedGraph]]s.
 */
object DirectedGraph {

  def apply[T](root : T) : DirectedGraph[T] = new DirectedGraph[T](Map(root -> Node[T](1, None)), root)

  case class Node[T](level : Int, parent : Option[T])

}
