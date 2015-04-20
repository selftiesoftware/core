package com.repocad.web.evaluating

import com.repocad.web.lexing.Lexer
import com.repocad.web.parsing._
import com.repocad.web.{Printer, Vector2D, _}

/**
 * An evaluator to evaluate a list of [[Expr]]
 */
object Evaluator {
  //vars needed to update the drawing bounding box
  //harvest biggest and smallest Y-coordinates in order to dynamically scale the drawing paper
  var minX : Option[Double] = None
  var maxX : Option[Double] = None
  var minY : Option[Double] = None
  var maxY : Option[Double] = None

  /*
  update the bounding box each time the drawing is evaluated.
   */
  def updateBoundingBox(x : Double, y: Double) : Vector2D = {
    if(minX.isDefined && maxX.isDefined && minY.isDefined && maxY.isDefined) {
      if (x >= maxX.get) maxX = Some(x)
      if (x <= minX.get) minX = Some(x)
      if (y >= maxY.get) maxY = Some(y)
      if (y <= minY.get) minY = Some(y)

      //first run: set the bounding box.
    } else {

      maxX = Some(x+1)
        minX = Some(x-1)
        maxY = Some(y+1)
        minY = Some(y-1)
    }

    //move the paper center to the center of the current artwork on the paper
    val cX = minX.get + (maxX.get - minX.get) / 2
    val cY = minY.get + (maxY.get - minY.get) / 2
    Vector2D(cX, cY)
  }

  /* run once before the evaluation loop to ensure the paper is scaled down again
     if the drawing extends are smaller after user editing of the drawing.
  */
  def resetBoundingBox() = {
    maxX = None
    minX = None
    maxY = None
    minY = None
  }

  type Env = Map[String, Any]

  type Value = Either[String, (Env, Any)]

  private var scriptEnv : Map[String, Expr] = Map()

  val dummyPrinter = new Printer {/**
   * Renders a text string
   * @param x First coordinate
   * @param y Second coordinate
   * @param h Height
   * @param t Text
   */
  override def text(x: Double, y: Double, h: Double, t: Any): Unit = Unit

    /**
     * Draws a circle
     * @param x First coordinate
     * @param y Second coordinate
     * @param r Radius
     */
    override def circle(x: Double, y: Double, r: Double): Unit = Unit

    /**
     * Draws an arc
     * @param x First coordinate
     * @param y Second coordinate
     * @param r Radius
     * @param sAngle start angle (3'o clock)
     * @param eAngle end angle
     */
    override def arc(x: Double, y: Double, r: Double, sAngle: Double, eAngle: Double): Unit = Unit

    /**
     * Draws a line
     * @param x1 First coordinate
     * @param y1 Second coordinate
     * @param x2 Third coordinate
     * @param y2 Fourth coordinate
     */
    override def line(x1: Double, y1: Double, x2: Double, y2: Double): Unit = Unit

    /**
     * Renders a text box
     * @param x First coordinate
     * @param y Second coordinate
     * @param w Width
     * @param h Line height
     * @param t Text
     */
    override def textBox(x: Double, y: Double, w: Double, h: Double, t: Any): Unit = Unit

    /**
     * Draws a bezier curve
     * @param x1 start x
     * @param y1 start y
     * @param x2 control point1 x
     * @param y2 control point1 y
     * @param x3 control point2 x
     * @param y3 control point2 y
     * @param x4 end x
     * @param y4 start y
     */
    override def bezierCurve(x1: Double, y1: Double, x2: Double, y2: Double, x3: Double, y3: Double, x4: Double, y4: Double): Unit = Unit
  }

  def eval(expr : Expr, printer : Printer) : Value = {
    try {
      eval(expr, printer.toEnv ++ RepoMath.toEnv, printer)
    } catch {
      case e : Exception => Left(s"Failure when evaluating script: ${e.getLocalizedMessage}")
    }
  }

  protected[evaluating] def eval(expr: Expr, env : Env, printer : Printer) : Value = {
    expr match {

      case ImportExpr(name) =>
        if (scriptEnv.contains(name)) {
          eval(scriptEnv(name), env, printer).right.map(v => (env ++ v._1) -> Unit)
        } else {
          Ajax.get("http://siigna.com:20004/get/" + name) match {
            case Response(_, 4, text) =>
              Parser.parse(Lexer.lex(text)).right.flatMap(v => {
                scriptEnv += name -> v
                eval(scriptEnv(name), env, printer).right.map(v => (env ++ v._1) -> Unit)
              })
            case xs => Left(s"Script $name failed to load with error: $xs")
          }
        }

      case FunctionExpr(name, params, body) =>
        val function = params.size match {
          case 0 => (p : Printer) => eval(body, env, p).fold(l => l, r => r._2)
          case 1 => (p : Printer, a: Any) => {
            eval(body, env.+(params(0) -> a), p).fold(l => l, r => r._2)
          }
          case 2 => (p : Printer, a: Any, b: Any) => eval(body, env.+(params(0) -> a, params(1) -> b), p).fold(l => l, r => r._2)
          case 3 => (p : Printer, a: Any, b: Any, c: Any) => eval(body, env.+(params(0) -> a, params(1) -> b, params(2) -> c), p).fold(l => l, r => r._2)
          case 4 => (p : Printer, a: Any, b: Any, c: Any, d: Any) => eval(body, env.+(params(0) -> a, params(1) -> b, params(2) -> c, params(3) -> d), p).fold(l => l, r => r._2)
          case x => Left("Unsupported number of arguments: " + x)
        }
        Right(env.+(name -> function) -> function)

      case ConstantExpr(value) => Right(env -> value)

      case CompExpr(e1, e2, op) =>
        eval(e1, env, printer).fold(e => Left(e), v1 => eval(e2, v1._1, printer).fold(e => Left(e), v2 => {
          val n1 = v1._2.asInstanceOf[Double]
          val n2 = v2._2.asInstanceOf[Double]
          op match {
            case ">" => Right(env -> (n1 > n2))
            case "<" => Right(env -> (n1 < n2))
            case x => Left(s"Unknown comparison operator $x")
          }
        }))

      case OpExpr(e1, e2, op) =>
        eval(e1, env, printer).right.flatMap(v1 => eval(e2, v1._1, printer).right.flatMap(v2 => {
          val n1 = v1._2.asInstanceOf[Double]
          val n2 = v2._2.asInstanceOf[Double]
          op match {
            case "-" => Right(env -> (n1 - n2))
            case "+" => Right(env -> (n1 + n2))
            case "*" => Right(env -> (n1 * n2))
            case "/" => Right(env -> (n1 / n2))
            case x => Left(s"Unknown arithmetic operator $x")
          }
        }))

      case RangeExpr(name, from, to) =>
        val fromOption: Either[String, Double] = env.get(name).map {
          case i: Int => Right(i + 1d)
          case i: Double => Right(i + 1)
          case x => Left(s"Cannot parse $x to int")
        }.getOrElse(getValue[Double](from, env, printer))

        val toOption = getValue[Double](to, env, printer)
        fromOption.right.flatMap(fromValue => toOption.right.flatMap(toValue => {
          Right((env + (name -> fromValue)) -> (fromValue < toValue))
        }))

      case RefExpr(name, params) =>
        env.get(name).fold[Value](Left(s"Failed to find function '$name'. Please check if it has been declared.")) {
          case f: Function1[Printer, Any] => Right(env -> f(printer))
          case f: Function2[Printer, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a => Right(a._1 -> f.apply(printer, a._2)))
          case f: Function3[Printer, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                Right(b._1 -> f.apply(printer, a._2, b._2))
              )
            )
          case f: Function4[Printer, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c => {
                  Right(c._1 -> f.apply(printer, a._2, b._2, c._2))}
                )
              )
            )
          case f: Function5[Printer, Any, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c =>
                  eval(params(3), c._1, printer).right.flatMap(d => {
                    Right(d._1 -> f.apply(printer, a._2, b._2, c._2, d._2))
                  })
                )
              )
            )
          case f: Function6[Printer, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c =>
                  eval(params(3), c._1, printer).right.flatMap(d =>
                    eval(params(4), d._1, printer).right.flatMap(e =>
                      Right(e._1 -> f.apply(printer, a._2, b._2, c._2, d._2, e._2))
                    )
                  )
                )
              )
            )
          case f: Function7[Printer, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c =>
                  eval(params(3), c._1, printer).right.flatMap(d =>
                    eval(params(4), d._1, printer).right.flatMap(e =>
                      eval(params(5), e._1, printer).right.flatMap(g =>
                        Right(g._1 -> f.apply(printer, a._2, b._2, c._2, d._2, e._2, g._2))
                      )
                    )
                  )
                )
              )
            )
          case f: Function8[Printer, Any, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c =>
                  eval(params(3), c._1, printer).right.flatMap(d =>
                    eval(params(4), d._1, printer).right.flatMap(e =>
                      eval(params(5), e._1, printer).right.flatMap(g =>
                        eval(params(6), g._1, printer).right.flatMap(h =>
                          Right(h._1 -> f.apply(printer, a._2, b._2, c._2, d._2, e._2, g._2, h._2))
                        )
                      )
                    )
                  )
                )
              )
            )
          case f: Function9[Printer, Any, Any, Any, Any, Any, Any, Any, Any, Any] =>
            eval(params(0), env, printer).right.flatMap(a =>
              eval(params(1), a._1, printer).right.flatMap(b =>
                eval(params(2), b._1, printer).right.flatMap(c =>
                  eval(params(3), c._1, printer).right.flatMap(d =>
                    eval(params(4), d._1, printer).right.flatMap(e =>
                      eval(params(5), e._1, printer).right.flatMap(g =>
                        eval(params(6), g._1, printer).right.flatMap(h =>
                          eval(params(7), h._1, printer).right.flatMap(i =>
                            Right(i._1 -> f.apply(printer, a._2, b._2, c._2, d._2, e._2, g._2, h._2, i._2))
                          )
                        )
                      )
                    )
                  )
                )
              )
            )

          case x => Left("Expected callable function, got " + x)
        }

      case RefExpr(name) =>
        env.get(name).fold[Value](
          Left(s"Failed to find function '$name'. Please check if it has been declared.")
        )(x => Right(env -> x))

      case seq: SeqExpr =>
        def foldRecursive(it: Iterator[Expr], foldEnv: Env): Value = {
          eval(it.next(), foldEnv, printer).fold(error => Left(error), t => {
            if (it.hasNext) {
              foldRecursive(it, t._1)
            } else {
              Right(t._1 -> t._2)
            }
          })
        }
        foldRecursive(seq.expr.iterator, env)

      case UnitExpr => Right(env -> Unit)

      case ValExpr(name, valExpr) =>
        eval(valExpr, env, printer).fold(Left(_), value => Right(env.+(name -> value._2) -> value._2))

      case LoopExpr(condition: Expr, body: Expr) =>
        /* Note to self: Too much recursion error when looping recursively */
        var loopEnv: Map[String, Any] = env
        var lastResult: Any = Unit
        var lastError: Option[String] = None
        def getCondition = eval(condition, loopEnv, printer).fold(error => {
          lastError = Some(error); false
        }, v => {
          loopEnv = v._1
          v._2.asInstanceOf[Boolean]
        })
        while (lastError.isEmpty && getCondition) {
          eval(body, loopEnv, printer).fold(s => {
            lastError = Some(s); s
          }, x => {
            lastResult = x._2
            loopEnv = x._1
          })
        }
        lastError.map(Left(_)).getOrElse(Right(loopEnv.filter(t => env.contains(t._1)) -> lastResult))

      case x => Left(s"Unknown expression $x")
    }
  }

  def getValue[T](expr : Expr, env : Env, printer : Printer) : Either[String, T] = {
    eval(expr, env, printer) match {
      case Right((_, t)) if t.isInstanceOf[Int] => Right(t.asInstanceOf[Int].toDouble.asInstanceOf[T])
      case Right((_, t : T)) => Right(t)
      case fail => {
        Left(s"Failed to read value from $expr, failed with: $fail")
      }
    }
  }

}
