package com.repocad.web

import com.repocad.geom.{Rectangle2D, TransformationMatrix => TM, Vector2D}
import com.repocad.view.ModelRenderer
import com.repocad.reposcript.model.{ModelRenderer, ShapeModel, TextModel}
import org.scalajs.dom.raw.HTMLCanvasElement
import org.scalajs.dom.{CanvasRenderingContext2D => CanvasContext}

/**
  * A printer that renders to a HTML5 canvas
  */
class CanvasRenderer(canvas: HTMLCanvasElement) extends ModelRenderer {

  val context = canvas.getContext("2d").asInstanceOf[CanvasContext]

  override val defaultFont: String = "Arial"


  private var scale: Double = 1

  def height = canvas.height

  def width = canvas.width

  def canvasCenter = Vector2D(width / 2, height / 2)

  private val canvasTransform = TM.id.translate(canvasCenter.x, canvasCenter.y).flipY

  var canvasToModelTransform = canvasTransform.inverse : TM

  override def calculateBoundary(textModel: TextModel): Rectangle2D = Rectangle2D(0, 0, 1, 1)

  def render(shapeModel: ShapeModel, _transformation: TM): TM = {
    val transform = canvasTransform concat _transformation
    canvasToModelTransform = transform.inverse

    scale = transform.scale
    setContextTM(context)(TM.id)
    context.clearRect(0,0,width,height)
    setContextTM(context)(transform)
    ModelRenderer.render(shapeModel, this)
    _transformation
  }

  //Does not account for centers with negative coords (would cause mirroring)
  override def renderWithZoomExtends(shapeModel: ShapeModel): TM = {
    val boundary = shapeModel.boundary

    val translation = -boundary.center
    val translationMatrix = TM.id.translate(translation.x, translation.y)

    val x_scale = (width - 30) / boundary.width
    val y_scale = (height - 30) / boundary.height
    val most_constricting = List(x_scale, y_scale).min
    val scaleMatrix = TM.id.scale(most_constricting)
    val zoomExtendsMatrix = scaleMatrix concat translationMatrix

    render(shapeModel, zoomExtendsMatrix)
  }

  override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = {
    context.beginPath()
    context.arc(x, y, r, sAngle, eAngle)
    context.stroke()
    context.lineWidth = 0.2 * scale
    context.closePath()
  }

  override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.bezierCurveTo(x2, y2, x3, y3, x4, y4)
    context.stroke()
    context.lineWidth = 0.2 * scale
  }

  override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.lineWidth = 0.2 * scale
    context.closePath()
  }

  override def circle(x: Double, y: Double, r: Double): Unit = {
    context.beginPath()
    context.arc(x, y, r, 0, 2 * Math.PI)
    context.lineWidth = 0.2 * scale
    context.stroke()
    context.closePath()
  }

  override def text(x: Double, y: Double, h: Double, t: Any): Map[String, Any] = {
    text(x, y, h, t, "Arial")
  }

  override def text(x: Double, y: Double, height: Double, t: Any, font: String): Map[String, Any] = {
    textLines(x, y, height, t.toString.split('\n'), font)
  }

  private def textLines(x: Double, y: Double, size: Double, lines: Seq[Any], font: String): Map[String, Any] = {
    //Mirror text horizontally. This is needed because we use the canvas Transformation matrix to invert the y-axis,
    //while relying on the canvas to render text, rather than doing it ourselves
    val mirrorTranslation = TM.id.translate(0,-y) //first translate to the horizontal axis
    val mirrorTransform = mirrorTranslation.inverse concat TM.id.flipY concat mirrorTranslation
    applyContextTM(context)(mirrorTransform)

    val totalHeight = size * lines.size
    val myFont: String = size + "px " + font
    context.font = myFont
    val dimension = lines.foldRight (Vector2D(0, y + size)) ((text, dimension) => {
      val textY = dimension.y - size
      val textWidth = math.max(dimension.x, context.measureText(text.toString).width)

      context.save()
      context.font = myFont
      context.fillStyle = "black"
      context.fillText(text.toString, x, textY)
      context.restore()
      Vector2D(textWidth, textY)
    })

    //Undo the mirroring, so that it will only apply to text
    val invMirrorTransform = mirrorTransform.inverse
    applyContextTM(context)(invMirrorTransform)
    Map("x" -> dimension.x, "y" -> totalHeight)
  }

  private def setContextTM(ctx: CanvasContext)(tm: TM) = {
    context.setTransform(tm.a,
                         tm.b,
                         tm.c,
                         tm.d,
                         tm.e,
                         tm.f)
  }

  private def applyContextTM(ctx: CanvasContext)(tm: TM) = {
    context.transform(tm.a,
                         tm.b,
                         tm.c,
                         tm.d,
                         tm.e,
                         tm.f)
  }
}
