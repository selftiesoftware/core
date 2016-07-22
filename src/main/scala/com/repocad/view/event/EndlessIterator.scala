package com.repocad.view.event

import scala.collection.mutable


/**
  * An endless iterator over elements based on an internal queue. If more elements than the maximum buffer size allows
  * (by default 1000) are queued, one element will be discarded for every insertion, thus keeping the queue to the
  * max buffer size.
  *
  * @param maxSize The maximum number of elements stored in the iterator, before old elements are being pushed out.
  * @tparam T The type of elements in the iterator.
  */
class EndlessIterator[T](maxSize: Int = 1000) extends mutable.Traversable[T] {

  private val queue : scala.collection.mutable.Queue[T] = mutable.Queue[T]()

  /**
    * Enqueues an element in the iterator.
    *
    * @param element The element to enqueue.
    */
  def enqueue(element: T): Unit = {
    if (queue.size >= maxSize) {
      queue.dequeue()
    }
    queue.enqueue(element)
  }

  /**
    * Takes the next elements from the iterator.
    *
    * @return An element of type [[T]].
    */
  def next: Option[T] = {
    queue.nonEmpty match {
      case true => Some(queue.dequeue())
      case false => None
    }
  }

  override def foreach[U](f: (T) => U): Unit = queue.foreach(f)

}
