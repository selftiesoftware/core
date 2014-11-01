package com.siigna.web.evaluating

import com.siigna.web.parsing._
import org.scalajs.dom.CanvasRenderingContext2D

import scala.collection.mutable

/**
 * An evaluator to evaluate a given list of [[Expr]] on the 
 * @param context  The graphical context to interact with.
 */
class Evaluator(context: CanvasRenderingContext2D) {

  def eval(expr: Expr, env : Map[String, Any]) : Either[String, Any] = {
    expr match {
      case LineExpr(e1, e2, e3, e4) =>
        eval(e1, env).right.foreach(x1 => {
          eval(e2, env).right.foreach(y1 => {
            eval(e3, env).right.foreach(x2 => {
              eval(e4, env).right.foreach(y2 => {
                context.beginPath()
                context.moveTo(x1.toString.toInt, y1.toString.toInt)
                context.lineTo(x2.toString.toInt, y2.toString.toInt)
                context.stroke()
                context.closePath()
              })
            })
          })
        })
        Left("")

      case ConstantExpr(value) => Right(value)

      case IntExpr(name, value) => Right(env.+(name -> value))

      case RefExpr(name) => env.get(name) match {
        case Some(x) => Right(x)
        case x => Left(s"Could not find variable $name of type in scope" )
      }

      case seq : SeqExpr =>
        seq.expr.foldLeft(Map[String, Any]())((map : Map[String, Any], ex : Expr) => eval(ex, map) match {
          case Right(newMap : Map[String, Any]) => newMap
          case x => println("Expected map, got " + x) ; map
        })
        Left("")

      case UnitExpr => Left("")

      case x => Left("Unknown expression " + x)
    }

  }

}