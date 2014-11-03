package com.siigna.web.evaluating

import com.siigna.web.parsing._
import org.scalajs.dom.CanvasRenderingContext2D

import scala.collection.mutable

/**
 * An evaluator to evaluate a given list of [[Expr]] on the 
 * @param context  The graphical context to interact with.
 */
class Evaluator(context: CanvasRenderingContext2D) {

  def eval(expr: Expr, env : Map[String, Any]) : Option[Any] = {
    expr match {
      case LineExpr(e1, e2, e3, e4) =>
        eval(e1, env).map(x1 => {
          eval(e2, env).foreach(y1 => {
            eval(e3, env).foreach(x2 => {
              eval(e4, env).foreach(y2 => {
                context.beginPath()
                context.moveTo(x1.toString.toInt, y1.toString.toInt)
                context.lineTo(x2.toString.toInt, y2.toString.toInt)
                context.stroke()
                context.closePath()
              })
            })
          })
        })

      case ConstantExpr(value) => Some(value)

      case IntExpr(name, value) => Some(env.+(name -> value))

      case RefExpr(name) => env.get(name)

      case seq : SeqExpr =>
        seq.expr.foldLeft(Map[String, Any]())((map : Map[String, Any], ex : Expr) => {
          println("Found: " + ex)
          eval(ex, map) match {
            case Some(newMap : Map[String, Any]) => newMap
            case x => println("Expected map, got " + x) ; map
          }
        })
        None

      case UnitExpr => None

      case x => Some("Unknown expression " + x)
    }

  }

}