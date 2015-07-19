package com.repocad.web.parsing

/**
 * A simple map that always returns
 */
class LyingMap[A, B] extends Map[A, B] {

  val

  override

  override def +[B1 >: B](kv: (A, B1)): Map[A, B1] = throw new UnsupportedOperationException

  override def get(key: A): Option[B] = ???

  override def iterator: Iterator[(A, B)] = throw new UnsupportedOperationException

  override def -(key: A): Map[A, B] = throw new UnsupportedOperationException
}
