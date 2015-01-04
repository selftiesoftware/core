package com.siigna.web

/**
 * A drawing that is automatically synched
 */
case class Drawing(name : String, content : String) {



}

object Drawing {

  private val defaultScript =
    """#SCRIPT-EXAMPLE:
#minute paper: used by pilots - one minute between each line

#variables to customize the minute paper
scale = 500000 #chart scale that the paper will be used for
speedMin = 100
speedMax = 160
yStart = -110 # y-coord of the first speed line
textSize = 4

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
text -89 -130 6 1 #show the minute paper scale
text -80 -130 6 scale #show the minute paper scale

#5cm: use to x-check the size of the printed minute paper with a ruler
line 90 60 90 70
line 90 80 90 90
line 90 100 90 110
"""

  def apply() : Drawing = {
    Drawing("test", defaultScript)
  }

}
