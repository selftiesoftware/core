package com.repocad.web.util

import org.scalajs.dom.raw.CanvasRenderingContext2D

import scala.scalajs.js

/**
  * Implicit helper functions for opentype conversion back and forth from JavaScript.
  */
package object opentype {

  implicit def opentypeFont2Font(opentypeFont: OpentypeFont): Font = {
    new Font {
      override def unitsPerEm: Double = opentypeFont.unitsPerEm

      override def draw(context: CanvasRenderingContext2D, line: String, i: Int,
                        yOffset: Double, scale: Double, options: Map[String, String]): Unit = {
        val jsObject = js.Dynamic.literal()
        for ((k, v) <- options) {
          jsObject.updateDynamic(k)(v)
        }
        opentypeFont.draw(context, line, i, yOffset, scale, jsObject)
      }

      override def stringToGlyphs(string: String): Array[Glyph] = opentypeFont.stringToGlyphs(string).toArray

      override def getKerningValue(first: Glyph, second: Glyph): Double =
        opentypeFont.getKerningValue(first, second)

      override def getPath(text: String, x: Double, y: Double, fontSize: Double): Path =
        opentypeFont.getPath(text, x, y, fontSize)

      override val ascender: Double = opentypeFont.ascender
      override val descender: Double = opentypeFont.descender
    }
  }

  implicit def opentypeGlyph2Glyph(opentypeGlyph: OpentypeGlyph): Glyph = {
    new Glyph {
      override val advanceWidth: Double = opentypeGlyph.advanceWidth

      override val yMin: Double = opentypeGlyph.yMin
      override val xMax: Double = opentypeGlyph.xMax
      override val xMin: Double = opentypeGlyph.xMin
      override val yMax: Double = opentypeGlyph.yMax
    }
  }

  implicit def glyph2OpentypeGlyph(glyph: Glyph): OpentypeGlyph = {
    js.Dynamic.literal(
      advanceWidth = glyph.advanceWidth,
      yMin = glyph.yMin,
      yMax = glyph.yMax,
      xMin = glyph.xMin,
      xMax = glyph.xMax).asInstanceOf[OpentypeGlyph]
  }

  implicit def opentypePath2Path(opentypePath: OpentypePath): Path = {
    new Path {
      override def draw(context: CanvasRenderingContext2D): Unit = opentypePath.draw(context)

      override def toSVG(decimalPlaces: Double): String = opentypePath.toSVG(decimalPlaces)
    }
  }

}
