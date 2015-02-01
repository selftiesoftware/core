package com.repocad.web.parsing

import com.repocad.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {

  type Value = Either[String, Expr]

  def parse(tokens : LiveStream[Token]) : Value = {
    try {
      var seq = Seq[Expr]()
      var seqFail : Option[String] = None
      var seqTail : LiveStream[Token] = tokens
      def seqSuccess: (Expr, LiveStream[Token]) => Value = (e, s) => {
        seqTail = s
        Right(e)
      }
      def seqFailure: (String) => Value = (s) => {
        seqFail = Some(s)
        Left(s)
      }
      while (seqFail.isEmpty && !seqTail.isPlugged) {
        parse(seqTail, seqSuccess, seqFailure)  match {
          case Left(s) => seqFail = Some(s)
          case Right(e) => if (seq != UnitExpr) seq = seq :+ e
        }
      }

      seqFail.map(seqFailure).getOrElse(Right(SeqExpr(seq)))
    } catch {
      case e : InternalError => {
        Left("Script too large (sorry - we're working on it!)")
      }
      case e : Exception => {
        Left(e.getLocalizedMessage)
      }
    }
  }

  def parse(tokens: LiveStream[Token], success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {

    tokens match {

      // Import
      case SymbolToken("import") :~: SymbolToken(script) :~: tail => {
        success(ImportExpr(script), tail)
      }

      case SymbolToken("if") :~: tail => {
        parse(tail, (condition, conditionTail) =>
          parse(conditionTail, (ifBody, ifBodyTail) => {
            ifBodyTail match {
              case SymbolToken("else") :~: elseIfTail => {
                parse(elseIfTail, (elseBody, elseBodyTail) => {
                  success(IfExpr(condition, ifBody, Some(elseBody)), elseBodyTail)
                }, failure)
              }

              case _ => success(IfExpr(condition, ifBody, None), ifBodyTail)
            }
          }, failure),
          failure)
      }

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


      // Function
      case SymbolToken("function") :~: SymbolToken(name) :~: PunctToken("(") :~: tail =>
        parseUntil(tail, PunctToken(")"), (params, paramsTail) => {
          params match {
            case SeqExpr(xs) if !xs.exists(!_.isInstanceOf[RefExpr]) => parse(paramsTail, (body, bodyTail) => {
              success(FunctionExpr(name, xs.asInstanceOf[Seq[RefExpr]].map(_.name), body), bodyTail)
            }, failure)
            case xs => failure("Expected parameter list, got " + xs)
          }
        }, failure)

      // Values
      case IntToken(value: Int) :~: tail => success(ConstantExpr(value), tail)
      case DoubleToken(value : Double) :~: tail => success(ConstantExpr(value), tail)
      case StringToken(value : String) :~: tail => success(ConstantExpr(value), tail)

      // Blocks
      case PunctToken("{") :~: tail => parseUntil(tail, PunctToken("}"), success, failure)
      case PunctToken("(") :~: tail => parseUntil(tail, PunctToken(")"), success, failure)

      // References
      case SymbolToken(name) :~: tail if !tail.isEmpty && !tail.isPlugged && tail.head.tag.equals("(") => parse(tail, (params, paramsTail) => {
        params match {
          case SeqExpr(xs) => success(RefExpr(name, xs), paramsTail)
          case xs => failure("Failed to parse ref call: Expected parameters, got " + xs)
        }
      }, failure)
      case SymbolToken(name) :~: tail => success(RefExpr(name), tail)

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

  def parseTripleOp(startToken : Token, tail : LiveStream[Token], comp : String, success : (Expr, Expr, String, LiveStream[Token]) => Value, failure: String => Value): Value = {
    parse(LiveStream(Iterable(startToken)), (ex1, _) =>
      parse(tail, (ex2, s2) => success(ex1, ex2, comp, s2), failure),
      failure)
  }

  def parseUntil(tokens: LiveStream[Token], token : Token, success: (Expr, LiveStream[Token]) => Value, failure: String => Value): Value = {
    var seq = Seq[Expr]()
    var seqFail : Option[String] = None
    var seqTail : LiveStream[Token] = tokens
    def seqSuccess: (Expr, LiveStream[Token]) => Value = (e, s) => {
      seqTail = s
      Right(e)
    }
    def seqFailure: (String) => Value = (s) => {
      seqFail = Some(s)
      Left(s)
    }
    while (seqFail.isEmpty && !seqTail.isPlugged && !seqTail.head.toString.equals(token.toString)) {
      parse(seqTail, seqSuccess, failure)  match {
        case Left(s) => seqFail = Some(s)
        case Right(e) => if (seq != UnitExpr) seq = seq :+ e
      }
    }

    seqFail.map(failure).getOrElse(success(SeqExpr(seq), if (seqTail.isPlugged) seqTail else seqTail.tail))
  }

}