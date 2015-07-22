package com.repocad.web.parsing

import com.repocad.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {

  type TypeEnv = Map[String, Type]
  type ValueEnv = Map[String, Expr]

  type Value = Either[String, (Expr, ValueEnv, TypeEnv)]

  type FailureCont = String => Value
  type SuccessCont = (Expr, ValueEnv, TypeEnv, LiveStream[Token]) => Value
  
  def verifyType(typeName : String, typeEnv : TypeEnv) : Either[String, Type] = {
    typeEnv.get(typeName) match {
      case Some(typeObject) => Right(typeObject)
      case _ => Left(s"No type of name '$typeName' found")
    }
  }

  def parse(tokens : LiveStream[Token]) : Value = {
    try {
      parseUntil(tokens, _ => true, Map(), Map(), (expr, values, types, _) => Right((expr, values, types)), e => Left(e))
    } catch {
      case e : InternalError => Left("Script too large (sorry - we're working on it!)")
      case e : Exception => Left(e.getLocalizedMessage)
    }
  }

  def parse(tokens: LiveStream[Token], valueEnv : ValueEnv, typeEnv : TypeEnv, success: SuccessCont, failure: FailureCont): Value = {

    tokens match {

      /*
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
      case SymbolToken("repeat") :~: tail => parseLoop(tail, success, failure)

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

*/

      // Functions and objects
      case SymbolToken("def") :~: SymbolToken(name) :~: PunctToken("(") :~: tail =>
        val cont : SuccessCont = (params, _, _, paramsTail) => {
          params match {
            case BlockExpr(xs) if xs.nonEmpty && !xs.exists(!_.isInstanceOf[RefExpr]) =>
              paramsTail match {
                case SymbolToken("=") :~: _ => {
                  parse(paramsTail, valueEnv, typeEnv, (body, _, _, bodyTail) => {
                    success(FunctionExpr(name, xs.asInstanceOf[Seq[RefExpr]], body), valueEnv, typeEnv, bodyTail)
                  }, failure)
                }
                case _ => {
                  failure(Error.OBJECT_MISSING_PARAMETERS(name))
                }
              }

            case xs => failure(Error.EXPECTED_PARAMETERS(xs.toString))
          }
        }
        parseUntil(tail, PunctToken(")"), valueEnv, typeEnv, cont, failure)

//        parseUntil(tail, PunctToken(")"), valueEnv, typeEnv, (paramsExpr : Expr, vs : ValueEnv, ts : TypeEnv, paramsTail : LiveStream[Token]) => paramsExpr match {
//          case BlockExpr(xs) if !xs.exists(!_.isInstanceOf[RefExpr]) =>
//            paramsTail match {
//              case SymbolToken("=") :~: definitionTail =>
//                failure("")
////                parse(definitionTail, valueEnv, typeEnv, (body, _, _, bodyTail) => {
////                val function = FunctionExpr(name, xs.asInstanceOf[Seq[RefExpr]], body)
////                success(function, valueEnv.+(name -> function), typeEnv, paramsTail)
////              }, failure)
//              case _ => failure("Expected a")
//            }
//
//          case xs => failure("Expected parameter list, got " + xs)
//        }, failure)

      // Assignments
      case SymbolToken("def") :~: SymbolToken(name) :~: SymbolToken(":") :~: SymbolToken(typeName) :~: SymbolToken("=") :~: tail =>
        verifyType(typeName, typeEnv).right.flatMap(t => parse(tail, valueEnv, typeEnv, (e, _, _, stream) => if (e.t == t) {
          success(DefExpr(name, e), valueEnv + (name -> e), typeEnv, stream)
        } else {
          failure(s"'$name' has the expected type $t, but was assigned to type ${e.t}")
        }, failure))

      case SymbolToken("def") :~: SymbolToken(name) :~: SymbolToken("=") :~: tail =>
        parse(tail, valueEnv, typeEnv, (e, _, _, stream) => success(DefExpr(name, e), valueEnv + (name -> e), typeEnv, stream), failure)

      // Values
      case BooleanToken(value: Boolean) :~: tail => success(BooleanExpr(value), valueEnv, typeEnv, tail)
      case SymbolToken("false") :~: tail => success(BooleanExpr(false), valueEnv, typeEnv, tail)
      case SymbolToken("true") :~: tail => success(BooleanExpr(true), valueEnv, typeEnv, tail)
      case DoubleToken(value : Double) :~: tail => success(DoubleExpr(value), valueEnv, typeEnv, tail)
      case IntToken(value: Int) :~: tail => success(IntExpr(value), valueEnv, typeEnv, tail)
      case StringToken(value : String) :~: tail => success(StringExpr(value), valueEnv, typeEnv, tail)

      // Blocks
      case PunctToken("{") :~: tail => parseUntil(tail, PunctToken("}"), valueEnv, typeEnv, success, failure)
      case PunctToken("(") :~: tail => parseUntil(tail, PunctToken(")"), valueEnv, typeEnv, success, failure)

      // References
      case SymbolToken(name) :~: SymbolToken("(") :~: tail => valueEnv.get(name) match {
        case Some(f: FunctionType) =>
          parseUntil(tail, SymbolToken(")"), valueEnv, typeEnv, (params : Expr, newValueEnv : ValueEnv, newTypeEnv : TypeEnv, paramsTail : LiveStream[Token]) => {

            params match {
              case _ if !newValueEnv.contains(name) => failure(s"Cannot reference non-existing function '$name'")
              case BlockExpr(xs) => success(CallExpr(name, xs.last.t, xs), newValueEnv, newTypeEnv, paramsTail)
              case xs => failure("Expected parameters for function call. Got " + xs)
            }
          }, failure)
        case _ => failure(Error.FUNCTION_NOT_FOUND(name))
      }

      case SymbolToken(name) :~: tail => valueEnv.get(name) match {
        case Some(expr) => success(RefExpr(name, expr.t), valueEnv, typeEnv, tail)
        case _ => failure(s"Cannot reference non-existing variable '$name'")
      }

      case SymbolToken(name) :~: tail =>
        valueEnv.get(name) match {
          case Some(expr) => success(RefExpr(name, expr.t), valueEnv, typeEnv, tail)
          case _ => failure(s"Cannot reference '$name'; are you sure it was defined above?")
        }

      /*
      case SymbolToken(name) :~: tail if !tail.isEmpty && !tail.isPlugged && tail.head.tag.equals("(") => parse(tail, valueEnv, typeEnv, (params, newValueEnv, newTypeEnv, paramsTail) => {
        params match {
          case _ if !newValueEnv.contains(name) => failure(s"Cannot reference non-existing variable '$name'")
          case BlockExpr(xs) => success(RefExpr(name, xs.last.t, xs), newValueEnv, newTypeEnv, paramsTail)
          case xs => failure("Failed to parse ref call: Expected parameters, got " + xs)
        }
      }, failure)*/

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

  /*def parseLoop(tokens : LiveStream[Token], success: (Expr, LiveStream[Token]) => Value, failure: String => Value) : Value = {
    def parseValueToken(value : Token) : Either[Expr, String] = {
      value match {
        case SymbolToken(name) => Left(RefExpr(name))
        case IntToken(value: Int) => Left(IntExpr(value))
        case DoubleToken(value : Double) => Left(DoubleExpr(value))
        case StringToken(value : String) => Left(StringExpr(value))
        case e => Right("Expected value, got " + e)
      }
    }
    def parseLoopWithRange(range : RangeExpr, loopTokens : LiveStream[Token], success: (Expr, LiveStream[Token]) => Value, failure: String => Value) : Value = {
      parse(loopTokens, (body, blockTail) => success(LoopExpr(range, body), blockTail), failure)
    }

    tokens match {
      case fromToken :~: SymbolToken("to") :~: toToken :~: SymbolToken("def") :~: SymbolToken(counter) :~: tail =>
        parseValueToken(toToken).fold(to => {
          parseValueToken(fromToken).fold(from => {
            parseLoopWithRange(RangeExpr(counter, from, to), tail, success, failure)
          }, failure)
        }, failure)

      case fromToken :~: SymbolToken("to") :~: toToken :~: tail =>
        parseValueToken(toToken).fold(to => {
          parseValueToken(fromToken).fold(from => {
            parseLoopWithRange(RangeExpr("_loopCounter", from, to), tail, success, failure)
          }, failure)
        }, failure)

      case toToken :~: SymbolToken("def") :~: SymbolToken(counter) :~: tail =>
        parseValueToken(toToken).fold(to => {
          parseLoopWithRange(RangeExpr(counter, IntExpr(1), to), tail, success, failure)
        }, failure)

      case toToken :~: tail =>
        parseValueToken(toToken).fold(to => {
          parseLoopWithRange(RangeExpr("_loopCounter", IntExpr(1), to), tail, success, failure)
        }, failure)

      case tail => failure("Failed to parse loop. Expected to-token, got " + tail)
    }
  }

  def parseTripleOp(startToken : Token, tail : LiveStream[Token], comp : String, success : (Expr, Expr, String, LiveStream[Token]) => Value, failure: String => Value): Value = {
    parse(LiveStream(Iterable(startToken)), (ex1, _) =>
      parse(tail, (ex2, s2) => success(ex1, ex2, comp, s2), failure),
      failure)
  }
  */

  def parseUntil(tokens: LiveStream[Token], token : Token, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure: FailureCont): Value = {
    parseUntil(tokens, stream => stream.head.toString.equals(token.toString), valueEnv, typeEnv, success, failure)
  }

  def parseUntil(tokens: LiveStream[Token], condition : LiveStream[Token] => Boolean, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont): Value = {
    var typeEnv : TypeEnv = Type.typeEnv
    var valueEnv : ValueEnv = Map()
    var seq = Seq[Expr]()
    var seqFail : Option[String] = None
    var seqTail : LiveStream[Token] = tokens
    def seqSuccess: SuccessCont = (e, v, t, s) => {
      seqTail = s
      Right((e, v, t))
    }
    def seqFailure: (String) => Value = (s) => {
      seqFail = Some(s)
      Left(s)
    }
    while (seqFail.isEmpty && !seqTail.isPlugged && !condition(seqTail)) {
      parse(seqTail, valueEnv, typeEnv, seqSuccess, seqFailure) match {
         case Left(s) => seqFail = Some(s)
         case Right((e, newValueEnv, newTypeEnv)) =>
           if (e != UnitExpr) seq = seq :+ e
           valueEnv = newValueEnv
           typeEnv = newTypeEnv
       }
    }

    if (condition(seqTail)) {
      seqTail = seqTail.tail
    }

    seqFail.map(seqFailure).getOrElse(success(BlockExpr(seq), valueEnv, typeEnv, seqTail))
  }

}