package com.repocad.web

import java.util.concurrent.TimeUnit

import com.repocad.geom.Rectangle2D
import com.repocad.reposcript.model.{FontMetrics, TextModel}
import com.repocad.web.util.opentype.{Font, Glyph}

import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future, Promise}
import scala.scalajs.js
import scala.util.Try
import scala.scalajs.concurrent.JSExecutionContext.Implicits.queue

/**
  * Font metrics using the open source library Opentype
  *
  * @see https://github.com/nodebox/opentype.js
  */
trait OpentypeFontMetrics extends FontMetrics {

  override def calculateBoundary(textModel: TextModel): Rectangle2D =
    getFontNow(textModel.font).map(font => {
      getLines(textModel.text)
        .map(line => calculateLineBoundary(line, font, textModel.size))
        .reduceLeft(_ expand _)
    }).getOrElse(Rectangle2D(0, 0, 0, 0))

  /**
    * Calculates the boundary for a single line of text.
    *
    * @param line      The line to calculate.
    * @param font      The font of the text.
    * @param fontScale The scale of the text.
    * @return A [[Rectangle2D]]
    */
  def calculateLineBoundary(line: String, font: Font, fontScale: Double): Rectangle2D = {
    val glyphs: Seq[Glyph] = font.stringToGlyphs(line)
    val scale = 1 / font.unitsPerEm * fontScale

    // Thanks to https://developer.tizen.org/community/tip-tech/working-fonts-using-opentype.js?langswitch=en
    if (glyphs.isEmpty) {
      // Make a minimum boundary to allow selection when nothing is displayed
      Rectangle2D(0, 0, fontScale * 0.5, fontScale * 0.5)
    } else {
      var ascent: Double = 0
      var descent: Double = 0
      var width: Double = 0
      var startX: Double = 0
      for (i <- glyphs.indices) {
        val glyph = glyphs(i)

        if (i == 0) {
          startX = glyph.xMin * scale
        }

        width += (glyph.xMax - glyph.xMin) * scale

        if (i > 0) {
          val previousGlyph = glyphs(i - 1)
          width += (previousGlyph.advanceWidth - (previousGlyph.xMax - previousGlyph.xMin)) * scale
        }

        if (i < glyphs.size - 1) {
          val kerning = font.getKerningValue(glyph, glyphs(i + 1))
          width += kerning * scale
        }

        ascent = math.max(ascent, glyph.yMax.asInstanceOf[Double])
        descent = math.min(descent, glyph.yMin.asInstanceOf[Double])
      }

      if (width == 0 || (descent + ascent) == 0) {
        val emptyXRange: (Double, Double) = if (width == 0) (0, fontScale * 0.5) else (startX, width)
        val emptyYRange: (Double, Double) = if (descent + ascent == 0) (0, fontScale * 0.5) else (descent * scale, ascent * scale)
        Rectangle2D(emptyXRange._1, emptyYRange._1, emptyXRange._2, emptyYRange._2)
      } else {
        Rectangle2D(startX, descent * scale, startX + width, ascent * scale)
      }
    }
  }

  /**
    * Attempts to fetch a font from the given url.
    *
    * @param url The url to fetch.
    * @return A font sometime in the future.
    */
  def getFont(url: String): Future[Font] = {
    val promise: Promise[Font] = Promise()
    js.Dynamic.global.opentype.load(url, (err: js.Dynamic, font: js.Dynamic) => {
      if (js.isUndefined(err)) {
        promise.success(font.asInstanceOf[Font])
      } else if (js.isUndefined(font)) {
        promise.failure(new RuntimeException(err.toString))
      } else {
        promise.failure(new RuntimeException("Expected font object but got " + font))
      }
    })
    promise.future
  }

  def getFontNow(url: String): Try[Font] = {
    Try(Await.result(getFont(url), Duration(500, TimeUnit.MILLISECONDS)))
  }

  private def getLines(input: String): Seq[String] = {
    if (input.isEmpty) {
      Seq("")
    } else {
      val newLines: Seq[String] = input.lines.toList
      if (input.endsWith("\n")) {
        newLines :+ ""
      } else {
        newLines
      }
    }
  }

}
