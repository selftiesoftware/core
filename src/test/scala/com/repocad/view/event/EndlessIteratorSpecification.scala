package com.repocad.view.event

import org.scalacheck.{Gen, Arbitrary, Properties}
import org.scalacheck.Prop.forAll

object EndlessIteratorSpecification extends Properties("Endless Iterator") {

  property("adds elements until a size") = {
    val maxSize = 10
    val queue = new EndlessIterator[Int](maxSize)
    forAll { (i: Int) =>
      val previousSize = queue.size
      queue.enqueue(i)
      if (previousSize == maxSize) {
        queue.size == previousSize
      } else {
        queue.size == previousSize + 1
      }
    }
  }

  property("empty queue holds no element") = {
    val queue = new EndlessIterator[Int](1)
    queue.isEmpty
  }

  property("queue with single element only holds one element") = {
    val queue = new EndlessIterator[Int](3)
    queue.enqueue(3)
    queue.next.contains(3) && queue.next.isEmpty
  }

}
