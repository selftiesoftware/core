package com.siigna.web.parsing

import com.siigna.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {

  type Value = Either[String, Expr]

  def parse(tokens : LiveStream[Token]) : Value = {
    var exprs : Seq[Expr] = Seq()
    val failure : String => Value = err => Left(err)
    def success : (Expr, LiveStream[Token]) => Value = (e, s) => {
      parse(s, success, failure)
      exprs = exprs.+:(e)
      Right(SeqExpr(exprs))
    }
    parse(tokens, success, failure)
  }

  def parse(tokens: LiveStream[Token], success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {
    tokens match {

      case SymbolToken("circle") :~: tail =>
        parse(tail, (centerX, t1) =>
          parse(t1, (centerY, t2) =>
            parse(t2, (radius, t3) => success(CircleExpr(centerX, centerY, radius), t3), failure),
          failure),
        failure)

      case SymbolToken("line") :~: tail =>
        parse(tail, (x1, t1) =>
          parse(t1, (y1, t2) =>
            parse(t2, (x2, t3) =>
              parse(t3, (y2, t4) => success(LineExpr(x1, y1, x2, y2), t4), failure),
              failure),
            failure),
        failure)

      // Loops
      case SymbolToken("while") :~: tail =>
        parse(tail, (condition, blockTail) =>
              parse(blockTail, (body, bodyTail) => success(LoopExpr(condition, body), bodyTail), failure),
              failure)

      case SymbolToken("for") :~: tail =>
        parse(tail, (assignment, blockTail) =>
              parse(blockTail, (body, bodyTail) => success(LoopExpr(assignment, body), bodyTail), failure),
              failure)

      // Assignment
      case SymbolToken(name) :~: SymbolToken("=") :~: tail =>
        parse(tail, (e, stream) => success(ValExpr(name, e), stream), failure)

      case SymbolToken(name) :~: SymbolToken("<-") :~: tail =>
        parse(tail, (from, stream) => {
            if (stream.head == SymbolToken("to")) {
              parse(stream.tail, (to, toTail) => success(RangeExpr(name, from, to), toTail), failure)
            } else {
              failure("Expected 'to', found " + stream.head)
            }
          }, failure)

      // Comparison
      case SymbolToken(e1) :~: SymbolToken(">") :~: tail =>
        parse(tail, (e2, stream) => success(CompExpr(RefExpr(e1), e2, ">"), stream), failure)

      case SymbolToken(e1) :~: SymbolToken("<") :~: tail =>
        parse(tail, (e2, stream) => success(CompExpr(RefExpr(e1), e2, "<"), stream), failure)

      // Operation
      case SymbolToken(e1) :~: SymbolToken("+") :~: tail =>
        parse(tail, (e2, stream) => success(OpExpr(RefExpr(e1), e2, "+"), stream), failure)
      case SymbolToken(e1) :~: SymbolToken("-") :~: tail =>
        parse(tail, (e2, stream) => success(OpExpr(RefExpr(e1), e2, "-"), stream), failure)
      case SymbolToken(e1) :~: SymbolToken("*") :~: tail =>
        parse(tail, (e2, stream) => success(OpExpr(RefExpr(e1), e2, "*"), stream), failure)

      case SymbolToken(name) :~: tail => success(RefExpr(name), tail)

      case IntToken(value: Int) :~: tail => success(ConstantExpr(value), tail)

      case PunctToken("{") :~: tail => parseUntil(tokens, PunctToken("}"), success, failure)
      case PunctToken("(") :~: tail => parseUntil(tokens, PunctToken(")"), success, failure)

      case LiveNil() :~: tail => Right(UnitExpr)
      case LiveNil() => Right(UnitExpr)

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

  def parseUntil(tokens: LiveStream[Token], token : Token, success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {
    tokens match {
      case newToken :~: tail =>
        var seqExpr : SeqExpr = SeqExpr(Seq())
        var rhsTail = tail
        var i = 10
        while (i > 0 && rhsTail.head.compare(token) != 0) {
          val res = parse(rhsTail, (e, s) => {
            rhsTail = s
            Right(e)
          }, failure)
          i = i - 1
          res.fold(msg => failure(msg), x => {
            seqExpr = SeqExpr(seqExpr.expr :+ x)
          })
        }
        if (seqExpr.expr.isEmpty) {
          failure(s"Failed to parse block until $token: $tokens")
        } else {
          success(seqExpr, rhsTail.tail)
        }

      case xs => failure(s"Expected token $token, found ${xs.head}")
    }
  }

}