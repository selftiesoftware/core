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
        eval(e1, env).foreach(x1 => {
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
        None

      case ConstantExpr(value) => Some(value)

      case IntExpr(name, value) => Some(env.+(name -> value))

      case RefExpr(name) => env.get(name)

      case seq : SeqExpr =>
        seq.expr.foldLeft(env)((map : Map[String, Any], ex : Expr) => {
          ex match {
            case v : ValExpr[_] => map + (v.name -> v.value)
            case _ => eval(ex, map); map
          }
        })
        None

      case UnitExpr => None

      case x => Some("Unknown expression " + x)
    }

  }

}