package com.siigna.web

import org.scalajs.dom
import org.scalajs.dom._
import scala.scalajs.js

/**
 * A drawing that is automatically synched
 */
sealed case class Drawing(name : String, content : String)

object Drawing {

  private val defaultScript =
    """#SCRIPT-EXAMPLE:
#minute paper: used by pilots - one minute between each line

#variables to customize the minute paper

scale = 500000 #chart scale
speedMin = 100
speedMax = 160
yStart = -110 # y-coord of the first speed line
textSize = 4


#SCRIPT STARTS HERE

dist = speedMax - speedMin
distance = 250 / dist

for i <- speedMin to speedMax {
  y1 = yStart
  y2 = yStart + distance

  speed1 = i * 1852
  speed1div = speed1
  speed1min = speed1div / 6
  speed1mm = speed1min * 100

  plusOne = i + 1
  speed2 = plusOne * 1852
  speed2div = speed2
  speed2min = speed2div / 6
  speed2mm = speed2min * 100

  # scale down to the paper scale
  scaleDiv = scale / 10
  s1 = speed1mm / scaleDiv
  s2 = speed2mm / scaleDiv

  #minute lines
  min = -720 / s1
  max = 800 / s1
  for j <- min to max {
    spacing1 = j * s1
    spacing2 = j * s2
    line spacing1 / 10 y1 spacing2 / 10 y2
  }

  line -80 y1 80 y1 #speed lines

  text -90 y1 textSize i #show knots

  yStart = yStart + distance
}

line -80 yStart 80 yStart #last speed line
text -90 130 textSize speedMax #last speed text
text -89 -130 9 "MINUTE PAPER FOR PILOTS       MAP SCALE 1:" #show the minute paper scale
text 50 -130 9 scale #show the minute paper scale

#5cm: use to x-check the size of the printed minute paper with a ruler
line 90 60 90 70
line 90 80 90 90
line 90 100 90 110
line 86 110 90 110
line 86 60 90 60
text 82 57 5 "5 cm"
text 81 116 5 "print"
text 81 120 5 "scale "
text 81 124 5 "check"
"""

  def apply() : Drawing = {
    val hash = window.location.hash.replace("#", "")
    if (hash.isEmpty) {
      Drawing(js.Math.random().toString.substring(7), defaultScript)
    } else {
      Drawing.get(hash).left.map(_ => Drawing(this.hashCode().toString, defaultScript)).merge
    }
  }

  private var listener : () => js.Any = () => ()

  dom.setInterval(() => listener(), 100)

  def get(name : String) : Either[String, Drawing] = {
    Ajax("http://siigna.com:20004/get/" + name).right.map(content => Drawing(name, content))
  }

  def setHashListener(fn : (String) => Unit) = {
    var oldLocation = window.location.hash
    listener = () => {
      val newLocation = window.location.hash
      if (newLocation != oldLocation) {
        oldLocation = newLocation
        fn(newLocation.substring(1))
      }
    }
  }

  //private def getDrawing()

}
