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
    try {
      def success : (Expr, LiveStream[Token]) => Value = (e, s) => {
          parse(s, success, failure)
        exprs = exprs.+:(e)
        Right(SeqExpr(exprs))
      }
      parse(tokens, success, failure)
    } catch {
      case e : Exception => Left(e.getLocalizedMessage)
    }
  }

  def parse(tokens: LiveStream[Token], success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {
    tokens match {

      // Import
      case SymbolToken("import") :~: SymbolToken(library) :~: tail =>
        success(ImportExpr(RefExpr(library)), tail)

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

      case SymbolToken("text") :~: tail =>
        parse(tail, (centerX, t1) =>
          parse(t1, (centerY, t2) =>
            parse(t2, (height, t3) =>
              parse(t3, (text, t4) => success(TextExpr(centerX, centerY, height, text), t4), failure),
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

      // Assignments
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

      // Comparisons
      case (start : Token) :~: SymbolToken(">") :~: tail =>
        parseTripleOp(start, tail, ">", (e1, e2, op, stream) => success(CompExpr(e1, e2, op), stream), failure)

      case (start : Token) :~: SymbolToken("<") :~: tail =>
        parseTripleOp(start, tail, "<", (e1, e2, op, stream) => success(CompExpr(e1, e2, op), stream), failure)

      // Operations
      case (start : Token) :~: SymbolToken("+") :~: tail =>
        parseTripleOp(start, tail, "+", (e1, e2, op, stream) => success(OpExpr(e1, e2, op), stream), failure)

      case (start : Token) :~: SymbolToken("-") :~: tail =>
        parseTripleOp(start, tail, "-", (e1, e2, op, stream) => success(OpExpr(e1, e2, op), stream), failure)

      case (start : Token) :~: SymbolToken("*") :~: tail =>
        parseTripleOp(start, tail, "*", (e1, e2, op, stream) => success(OpExpr(e1, e2, op), stream), failure)

      case (start : Token) :~: SymbolToken("/") :~: tail =>
        parseTripleOp(start, tail, "/", (e1, e2, op, stream) => success(OpExpr(e1, e2, op), stream), failure)


      // Misc
      case SymbolToken(name) :~: tail => success(RefExpr(name), tail)

      case IntToken(value: Int) :~: tail => success(ConstantExpr(value), tail)

      case PunctToken("{") :~: tail => parseUntil(tokens, PunctToken("}"), success, failure)
      case PunctToken("(") :~: tail => parseUntil(tokens, PunctToken(")"), success, failure)

      case LiveNil() :~: tail => Right(UnitExpr)
      case LiveNil() => Right(UnitExpr)

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

  def parseTripleOp(startToken : Token, tail : LiveStream[Token], comp : String, success : (Expr, Expr, String, LiveStream[Token]) => Value, failure: String => Value): Value = {
    parse(LiveStream(Iterable(startToken)), (ex1, _) =>
      parse(tail, (ex2, s2) => success(ex1, ex2, comp, s2), failure),
      failure)
  }

  def parseUntil(tokens: LiveStream[Token], token : Token, success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {
    tokens match {
      case newToken :~: tail =>
        var lastFailure : Option[String] = None
        var seqExpr : SeqExpr = SeqExpr(Seq())
        var rhsTail = tail
        while (lastFailure.isEmpty && rhsTail.head.compare(token) != 0) {
          val res = parse(rhsTail, (e, s) => {
            rhsTail = s
            Right(e)
          }, string => {
            lastFailure = Some(string)
            Left(string)
          })
          res.right.map(x => {
            seqExpr = SeqExpr(seqExpr.expr :+ x)
          })
        }

        if (lastFailure.isDefined) {
          failure(s"Failure while parsing block: ${lastFailure.get}")
        } else if (seqExpr.expr.isEmpty) {
          failure(s"Failed to parse block until $token: $tokens")
        } else {
          success(seqExpr, rhsTail.tail)
        }

      case xs => failure(s"Expected token $token, found ${xs.head}")
    }
  }

}