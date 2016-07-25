package com.repocad.web.util.opentype

import org.scalajs.dom.raw.CanvasRenderingContext2D

import scala.scalajs.js

trait Font {

  val ascender: Double

  val descender: Double

  def draw(context: CanvasRenderingContext2D, line: String, i: Int, yOffset: Double,
           scale: Double, options: Map[String, String]): Unit

  def getKerningValue(first: Glyph, second: Glyph): Double

  def getPath(text: String, x: Double, y: Double, fontSize: Double): Path

  def stringToGlyphs(string: String): Array[Glyph]

  def unitsPerEm: Double

}

@js.native
trait OpentypeFont extends js.Object {

  val ascender: Double

  val descender: Double

  def draw(context: CanvasRenderingContext2D, line: String, i: Int, yOffset: Double, scale: Double, options: js.Dynamic): Unit

  def getKerningValue(first: OpentypeGlyph, second: OpentypeGlyph): Double

  def getPath(text: String, x: Double, y: Double, fontSize: Double): OpentypePath

  def stringToGlyphs(string: String): js.Array[Glyph]

  def unitsPerEm: Double

}
