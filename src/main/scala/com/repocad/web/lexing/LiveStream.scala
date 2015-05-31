package com.repocad.web.lexing

/**
Provides the input to a live stream.
  */
class LiveStreamSource[A] {
  private val queue = new scala.collection.mutable.Queue[A]()

  private var _isTerminated = false

  private var listeners : List[List[A] => Unit] = List()

  /**
  Adds a listener to this source; gets called whenever new
   elements are added.
    */
  def addListener (listener : List[A] => Unit) =
    listeners = listener :: listeners

  /**
  @return true iff this source has been terminated.
    */
  def isTerminated = _isTerminated


  /**
  Terminates this source.
    */
  def terminate() {
    _isTerminated = true
    for (l <- listeners) {
      l(List())
    }
  }

  /**
  @return true iff this source will never have more input.
    */
  def isEmpty = queue.isEmpty && this.isTerminated

  /**
  @return true iff this source has more input ready.
    */
  def hasNext = queue.nonEmpty

  /**
  @return the next input.
    */
  def next = queue.dequeue()

  /**
  Adds another element to this source.
    */
  def += (a : A) {
    queue += a
    for (l <- listeners) {
      l(List(a))
    }
  }

  /**
  Adds several more elements to this source.
    */
  def ++= (seq : Iterable[A]) {
    queue ++= seq
    val list = seq.toList
    for (l <- listeners) {
      l(list)
    }
  }

}


/**
Helper object for live streams.
  */
object LiveStream {

  /**
  Creates a character-based live stream from a string.
    */
  def apply(string : String) : LiveStream[Char] = {
    val source = new LiveStreamSource[Char]

    source ++= string

    source.terminate()

    new LiveStream[Char](source)
  }

  def apply[T](element : T): LiveStream[T] = {
    val source = new LiveStreamSource[T]()
    val stream = new LiveStream[T](source)
    source += element
    stream
  }

  /**
  Creates an iterable live stream.
    */
  def apply[C](it : Iterable[C]) : LiveStream[C] = {
    val source = new LiveStreamSource[C]
    source ++= it
    new LiveStream[C](source)
  }

}


/**
A live stream is a stream whose tail may grow over time.

 Every stream has a source which determines its tail.
  */
class LiveStream[A](val source : LiveStreamSource[A]) {

  private var headCache : Option[A] = None
  private var tailCache : Option[LiveStream[A]] = None

  /**
  @return true iff this object is currently the last element in a stream.
    */
  def isPlugged : Boolean = headCache.isEmpty && !source.hasNext

  /**
  @return true iff this object is the last element in a stream, and the source is terminated.
    */
  def isEmpty : Boolean = this.isPlugged && source.isTerminated

  /**
  @return if not plugged, the object at this location in the stream.
    */
  def head = headCache match {
    case Some(a) => a
    case None =>
      if (this.isPlugged)
        throw new IllegalStateException("Can't pull a plugged head!")

      headCache = Some(source.next)

      headCache.get
  }

  /**
  @return if not plugged, the remainder of this stream.
    */
  def tail = {
    if (this.isPlugged)
      throw new Exception("Can't pull a plugged tail!")

    tailCache match {
      case Some(as) => as
      case None =>
        this.head
        tailCache = Some(new LiveStream(source))
        tailCache.get
    }
  }

  override def toString : String = {
    if (this.isEmpty) {
      "LiveNil()"
    } else if (this.isPlugged) {
      "LivePlug()"
    } else {
      this.head + " :~: " + this.tail
    }
  }
}

/**
Pattern matches the current last element of a live stream.
  */
object LivePlug {
  def unapplySeq[A](stream : LiveStream[A]) : Option[List[A]] = {
    if (stream.isPlugged)
      Some(Nil)
    else
      None
  }
}

/**
Pattern matches the end of a (terminated) live stream.
  */
object LiveNil {
  def unapplySeq[A](stream : LiveStream[A]) : Option[List[A]] = {
    if (stream.isEmpty)
      Some(Nil)
    else
      None
  }
}


/**
Pattern matches an element and its tail in a live stream.
  */
object :~: {
  def unapply[A](stream : LiveStream[A]) : Option[(A,LiveStream[A])] = {
    if (stream.isPlugged)
      None
    else
      Some(stream.head -> stream.tail)
  }

  def unapplySeq[A](stream : LiveStream[A]) : Option[LiveStream[A]] = Some(stream)

}
