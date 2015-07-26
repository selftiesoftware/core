package com.repocad.web.parsing

import com.repocad.com.repocad.util.DirectedGraph
import com.repocad.web.{parsing, Response, Ajax}
import com.repocad.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {
  
  def verifyType(typeName : String, typeEnv : TypeEnv) : Either[String, Type] = {
    stringTypeMap.get(typeName) match {
      case Some(typeObject) if typeEnv.exists(typeObject) => Right(typeObject)
      case _ => Left(Error.TYPE_NOT_FOUND(typeName))
    }
  }

  def parse(tokens : LiveStream[Token]) : Value = {
    try {
      parseUntil(tokens, _ => true, defaultValueEnv, defaultTypeEnv, (expr, values, types, _) => Right((expr, values, types)), e => Left(e))
    } catch {
      case e : InternalError => Left("Script too large (sorry - we're working on it!)")
      case e : Exception => Left(e.getLocalizedMessage)
    }
  }

  def parse(tokens: LiveStream[Token], valueEnv : ValueEnv, typeEnv : TypeEnv, success: SuccessCont, failure: FailureCont): Value = {

    tokens match {

      // Import
      case SymbolToken("import") :~: SymbolToken(script) :~: tail => {
        RemoteParser.get(script) match {
          case Left(error) => failure(error)
          case Right((expr, importValueEnv, importTypeEnv)) => success(expr, importValueEnv, importTypeEnv, tail)
        }
      }

      /*
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
      case SymbolToken("def") :~: tail => parseDefinition(tail, valueEnv, typeEnv, success, failure)

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

      case (firstToken : Token) :~: SymbolToken(functionName) :~: (secondToken : Token) :~: tail
        if valueEnv.get(functionName).filter(_.isInstanceOf[FunctionExpr])
          .exists(_.asInstanceOf[FunctionExpr].params.size == 2) =>
        val funExpr = valueEnv.get(functionName).get.asInstanceOf[FunctionExpr]
        val funParams = funExpr.params
        parse(LiveStream(Iterable(firstToken)), valueEnv, typeEnv, (firstParam, _, _, _) => {
          parse(LiveStream(Iterable(secondToken)), valueEnv, typeEnv, (secondParam, _, _, _) => {
            (typeEnv.getChildOf(funExpr.params.head.t, firstParam.t), typeEnv.getChildOf(funExpr.params.last.t, secondParam.t)) match {
              case (Some(firstType), Some(secondType)) => success(CallExpr(functionName, funExpr.t, Seq(firstParam, secondParam)), valueEnv, typeEnv, tail)
              case (None, Some(secondType)) => failure(Error.TYPE_MISMATCH(funParams.head.toString, firstParam.toString))
              case (Some(firstType), None) => failure(Error.TYPE_MISMATCH(funParams.head.toString, secondParam.toString))
              case (None, None) => failure(Error.TWO(Error.TYPE_MISMATCH(funParams.tail.toString, firstParam.toString),
                Error.TYPE_MISMATCH(funParams(1).toString, secondParam.toString)))
            }
          }, failure)
        }, failure)

      // Values
      case BooleanToken(value: Boolean) :~: tail => success(BooleanExpr(value), valueEnv, typeEnv, tail)
      case SymbolToken("false") :~: tail => success(BooleanExpr(false), valueEnv, typeEnv, tail)
      case SymbolToken("true") :~: tail => success(BooleanExpr(true), valueEnv, typeEnv, tail)
      case DoubleToken(value : Double) :~: tail => success(FloatExpr(value), valueEnv, typeEnv, tail)
      case IntToken(value: Int) :~: tail => success(IntExpr(value), valueEnv, typeEnv, tail)
      case StringToken(value : String) :~: tail => success(StringExpr(value), valueEnv, typeEnv, tail)

      case SymbolToken(name) :~: tail =>
        valueEnv.get(name) match {
        case Some(expr) => success(RefExpr(name, expr.t), valueEnv, typeEnv, tail)
        case _ => failure(Error.REFERENCE_NOT_FOUND(name))
      }

      /*
      case SymbolToken(name) :~: tail if !tail.isEmpty && !tail.isPlugged && tail.head.tag.equals("(") => parse(tail, valueEnv, typeEnv, (params, newValueEnv, newTypeEnv, paramsTail) => {
        params match {
          case _ if !newValueEnv.contains(name) => failure(s"Cannot reference non-existing variable '$name'")
          case BlockExpr(xs) => success(RefExpr(name, xs.last.t, xs), newValueEnv, newTypeEnv, paramsTail)
          case xs => failure("Failed to parse ref call: Expected parameters, got " + xs)
        }
      }, failure)*/

      case stream if stream.isEmpty => success(UnitExpr, valueEnv, typeEnv, stream)

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

  */

  def parseDefinition(tokens : LiveStream[Token], valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont) : Value = {
    def parseFunctionParameters(parameterTokens : LiveStream[Token], success : (Seq[RefExpr], LiveStream[Token]) => Value, failure : FailureCont) = {
      parseUntil(parseParameters, parameterTokens, _.head.tag.toString.equals(")"), valueEnv, typeEnv, (params, _, _, paramsTail) => {
        params match {
          case BlockExpr(exprs) => success(exprs.asInstanceOf[Seq[RefExpr]], paramsTail)
          case _ => failure(Error.EXPECTED_PARAMETERS(params.toString))
        }
      }, failure)
    }

    def parseFunctionParametersAndBody(parameterTokens : LiveStream[Token], paramsEnv : Seq[RefExpr], success : (Seq[RefExpr], Expr, LiveStream[Token]) => Value, failure : FailureCont) : Value = {
      parseFunctionParameters(parameterTokens, (params, paramsTail) => {
        paramsTail match {
          case SymbolToken("=") :~: functionTail =>
            parseFunctionBody(functionTail, paramsEnv ++ params, (body, _, _, bodyTail) => success(params, body, bodyTail), failure)

          case tail => failure(Error.SYNTAX_ERROR("=", tail.toString))
        }
      }, failure)
    }

    def parseFunctionBody(bodyTokens : LiveStream[Token], paramsEnv : Seq[RefExpr], success : SuccessCont, failureCont: FailureCont) : Value = {
      parse(bodyTokens, valueEnv ++ paramsEnv.map(ref => ref.name -> ref).toMap, typeEnv, success, failure)
    }

    tokens match {
      /* Functions */
      case PunctToken("(") :~: tail => parseFunctionParameters(tail, (firstParams, firstTail) => {
        firstTail match {
          case SymbolToken(name) :~: PunctToken("(") :~: tail =>
            parseFunctionParametersAndBody(tail, firstParams, (secondParams, body, bodyTail) => {
              val function = FunctionExpr(name, firstParams ++ secondParams, body)
              success(function, valueEnv.+(name -> function), typeEnv, bodyTail)
            }, failure)

          case SymbolToken(name) :~: SymbolToken("=") :~: tail =>
            parseFunctionBody(tail, firstParams, (body, _, _, bodyTail) => {
              val function = FunctionExpr(name, firstParams, body)
              success(function, valueEnv.+(name -> function), typeEnv, bodyTail)
            }, failure)

        }
      }, failure)

      case SymbolToken(name) :~: PunctToken("(") :~: tail =>
        parseFunctionParametersAndBody(tail, Seq(), (parameters, body, bodyTail) => {
          val function = FunctionExpr(name, parameters, body)
          success(function, valueEnv.+(name -> function), typeEnv, bodyTail)
        }, failure)


      /* Assignments */
      case SymbolToken(name) :~: SymbolToken("as") :~: SymbolToken(typeName) :~: SymbolToken("=") :~: tail =>
        verifyType(typeName, typeEnv).right.flatMap(t => parse(tail, valueEnv, typeEnv, (e, _, _, stream) => if (e.t == t) {
          success(DefExpr(name, e), valueEnv + (name -> e), typeEnv, stream)
        } else {
          failure(s"'$name' has the expected type $t, but was assigned to type ${e.t}")
        }, failure))

      case SymbolToken(name) :~: SymbolToken("=") :~: tail =>
        parse(tail, valueEnv, typeEnv, (e, _, _, stream) => success(DefExpr(name, e), valueEnv + (name -> e), typeEnv, stream), failure)

    }
  }

  def parseParameters(tokens: LiveStream[Token], valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont) : Value = {
    tokens match {
      case SymbolToken(name) :~: SymbolToken("as") :~: SymbolToken(typeName) :~: tail =>
        verifyType(typeName, typeEnv) match {
          case Right(t) =>
            val reference = RefExpr(name, t)
            success(reference, valueEnv.+(name -> reference), typeEnv, tail)
          case Left(error) => Left(error)
        }
      case SymbolToken(name) :~: tail => failure(Error.EXPECTED_TYPE_PARAMETERS(name))
    }
  }

  /*
  def parseTripleOp(startToken : Token, tail : LiveStream[Token], comp : String, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure: String => Value): Value = {
    parse(LiveStream(startToken), (ex1, firstValueEnv, firstTypeEnv, _) =>
      parse(tail, (ex2, secondValueEnv, secondTypeEnv, s2) => success(ex1, ex2, comp, valueEnv, typeEnv, s2), failure),
      failure)
  }
  */

  def parseUntil(tokens: LiveStream[Token], token : Token, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure: FailureCont): Value = {
    parseUntil(parse, tokens, stream => stream.head.toString.equals(token.toString), valueEnv, typeEnv, success, failure)
  }

  def parseUntil(tokens: LiveStream[Token], condition : LiveStream[Token] => Boolean, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont): Value = {
    parseUntil(parse, tokens, condition, valueEnv, typeEnv, success, failure)
  }

  def parseUntil(parseFunction : (LiveStream[Token], ValueEnv, TypeEnv, SuccessCont, FailureCont) => Value, tokens: LiveStream[Token], condition : LiveStream[Token] => Boolean, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont): Value = {
    var typeEnvVar : TypeEnv = typeEnv
    var valueEnvVar : ValueEnv = Map()
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
      parseFunction(seqTail, valueEnvVar, typeEnv, seqSuccess, seqFailure) match {
         case Left(s) => seqFail = Some(s)
         case Right((e, newValueEnv, newTypeEnv)) =>
           if (e != UnitExpr) seq = seq :+ e
           valueEnvVar = newValueEnv
           typeEnvVar = newTypeEnv
       }
    }

    if (condition(seqTail)) {
      seqTail = seqTail.tail
    }

    seqFail.map(seqFailure).getOrElse(success(BlockExpr(seq), valueEnv, typeEnv, seqTail))
  }

}