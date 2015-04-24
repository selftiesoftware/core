package com.repocad.event

/**
 * An overall type for events
 */
trait Event

trait KeyboardEvent extends Event
case class KeyDown(key : Int) extends Event
