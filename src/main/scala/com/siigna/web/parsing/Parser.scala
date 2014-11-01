package com.siigna.web.parsing

import com.siigna.web.lexing._
/**
 * Parses code into drawing commands
 */
object Parser {

  val exprAssignment = """([\p{L}]+) ?= ?([0-9]+)""".r
  val exprNumber = """([0-9]+)""".r
  val exprRHS = """([\p{L}+])""".r

  def parse(tokens: LiveStream[Token]): Either[String, Expr] = {
    tokens match {
      case SymbolToken("line") :~: IntToken(x1) :~: IntToken(y1) :~: IntToken(x2) :~: IntToken(y2) :~: tail =>
        parse(tail).right.map(expr => SeqExpr(LineExpr(ConstantExpr(x1), ConstantExpr(y1), ConstantExpr(x2), ConstantExpr(y2)), expr))

      case SymbolToken("line") :~: tail =>
        parse(tail).right.flatMap(x1 =>
          parse(tail.tail).right.flatMap(y1 =>
            parse(tail.tail.tail).right.flatMap(x2 =>
              parse(tail.tail.tail.tail).right.flatMap(y2 => {
               parse(tail.tail.tail.tail.tail).right.map(expr => SeqExpr(LineExpr(x1, y1, x2, y2), expr))
              })
            )
          )
        )

      case SymbolToken("val") :~: SymbolToken(name) :~: SymbolToken("=") :~: IntToken(value) :~: tail =>
        parse(tail).right.map(expr => SeqExpr(IntExpr(name, value), expr))

      case SymbolToken(name) :~: tail => Right(RefExpr(name))

      case IntToken(value : Int) :~: tail => Right(ConstantExpr(value))

      case LiveNil() :~: tail => Right(UnitExpr)
      case LiveNil() => Right(UnitExpr)

      case xs => {
        Left(s"Unrecognised token pattern $xs")
      }
    }
  }

}