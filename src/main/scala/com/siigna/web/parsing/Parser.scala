package com.siigna.web.parsing

import collection.mutable
import com.siigna.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {

  val exprAssignment = """([\p{L}]+) ?= ?([0-9]+)""".r
  val exprNumber = """([0-9]+)""".r
  val exprRHS = """([\p{L}+])""".r

  def parse(tokens : LiveStream[Token]) : Expr = {
    var exprs : Seq[Expr] = Seq()
    val failure : String => Expr = err => {println(err); UnitExpr}
    def success : (Expr, LiveStream[Token]) => Expr = (e, s) => {
        exprs = exprs :+ e
        parse(s, success, failure)
      }
    parse(tokens, success, failure)
    SeqExpr(exprs)
  }

  def parse(tokens: LiveStream[Token], success: (Expr, LiveStream[Token]) => Expr, failure: String => Expr): Expr = {
    tokens match {

      case SymbolToken("line") :~: tail =>
        parse(tail, (x1, t1) =>
          parse(t1, (y1, t2) =>
            parse(t2, (x2, t3) =>
              parse(t3, (y2, t4) => success(LineExpr(x1, y1, x2, y2), t4), failure),
              failure),
            failure),
        failure)


      case SymbolToken("while") :~: tail =>
        parse(tail, (condition, blockTail) =>
              parse(blockTail, (body, bodyTail) => success(WhileExpr(condition, body), bodyTail), failure),
              failure)

      // Assignment
      case SymbolToken(name) :~: SymbolToken("=") :~: tail =>
        parse(tail, (e, stream) => success(ValExpr(name, e), stream), failure)

      // Comparison
      case SymbolToken(e1) :~: SymbolToken(">") :~: tail =>
        parse(tail, (e2, stream) => success(CompExpr(RefExpr(e1), e2, ">"), stream), failure)

      // Operation
      case SymbolToken(e1) :~: SymbolToken("-") :~: tail =>
        parse(tail, (e2, stream) => success(OpExpr(RefExpr(e1), e2, "-"), stream), failure)

      case SymbolToken(name) :~: tail => success(RefExpr(name), tail)

      case IntToken(value: Int) :~: tail => success(ConstantExpr(value), tail)

      case PunctToken("{") :~: tail => parseUntil(tokens, PunctToken("}"), success, failure)
      case PunctToken("(") :~: tail => parseUntil(tokens, PunctToken(")"), success, failure)

      case LiveNil() :~: tail => UnitExpr
      case LiveNil() => UnitExpr

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

  def parseUntil(tokens: LiveStream[Token], token : Token, success: (Expr, LiveStream[Token]) => Expr, failure: String => Expr): Expr = {
    tokens match {
      case newToken :~: tail => {
        var seqExpr : SeqExpr = SeqExpr(Seq())
        var rhsTail = tail
        var i = 10
        while (i > 0 && rhsTail.head.compare(token) != 0) {
          val res = parse(rhsTail, (e, s) => {rhsTail = s; e}, failure)
          seqExpr = SeqExpr(seqExpr.expr :+ res)
          i = i - 1
        }
        if (seqExpr.expr.isEmpty) {
          failure(s"Failed to parse block until $token: $tokens")
        } else {
          success(seqExpr, rhsTail.tail)
        }
      }
      case xs => failure(s"Expected token $token, found ${xs.head}")
    }
  }

}