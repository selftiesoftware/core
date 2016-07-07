package com.repocad.web.util.event

import scala.collection.mutable

/**
  * An endless iterator over elements based on an internal queue. If more elements than the maximum buffer size allows
  * (by default 1000) are queued, one element will be discarded for every insertion, thus keeping the queue to the
  * max buffer size.
  *
  * @param maxSize The maximum number of elements stored in the iterator, before old elements are being pushed out.
  * @tparam T The type of elements in the iterator.
  */
class EndlessIterator[T](maxSize: Int = 1000) extends Iterator[T] {

  private val queue = mutable.Queue[T]()

  /**
    * Enqueues an element in the iterator.
    *
    * @param element The element to enqueue.
    */
  def enqueue(element: T): Unit = {
    if (queue.size >= 1000) {
      queue.dequeue()
    }
    queue.enqueue(element)
  }

  /**
    * Examines if an element is queued.
    *
    * @return True if an element is enqueued and ready to be dequeued.
    */
  override def hasNext: Boolean = queue.nonEmpty

  /**
    * Takes the next elements from the iterator.
    *
    * @return An element of type [[T]].
    */
  override def next: T = queue.dequeue()

}
