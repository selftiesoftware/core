package com.repocad.web.parsing

import com.repocad.web.Environment
import com.repocad.web.lexing._

/**
 * Parses code into drawing expressions (AST)
 */
object Parser {

  private val DEFAULT_LOOP_COUNTER = "_loopCounter"
  
  def verifyType(typeName : String, typeEnv : TypeEnv) : Either[String, AnyType] = {
    stringTypeMap.get(typeName) match {
      case Some(typeObject) if typeEnv.exists(typeObject) => Right(typeObject)
      case _ => Left(Error.TYPE_NOT_FOUND(typeName))
    }
  }

  def verifySimilarTypes(functionName : String, expected : Seq[RefExpr], actual : Seq[Expr], typeEnv : TypeEnv) : Option[String] = {
    if (actual.size != expected.size) {
      Some(Error.EXPECTED_PARAMETER_NUMBER(functionName, expected.size, actual.size))
    } else {
      expected.zip(actual).collect {
        case (expectedParam, actualParam) if typeEnv.getChildOf(expectedParam.t, actualParam.t).isEmpty =>
          return Some(Error.TYPE_MISMATCH(expectedParam.t.toString, actualParam.t.toString))
      }
      None
    }
  }

  def parse(tokens : LiveStream[Token]) : Value = {
    try {
      parseUntil(tokens, _ => false, Environment.getParserEnv, defaultTypeEnv, (expr, values, types, _) => Right((expr, values, types)), e => Left(e))
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

      case SymbolToken("if") :~: tail => {
        parse(tail, valueEnv, typeEnv, (condition, _, _, conditionTail) => {
          if (condition.t != BooleanType) {
            failure(Error.TYPE_MISMATCH(BooleanType.toString, condition.t.toString))
          } else {
            parse(conditionTail, valueEnv, typeEnv, (ifBody, _, _, ifBodyTail) => {
              ifBodyTail match {
                case SymbolToken("else") :~: elseIfTail => {
                  parse(elseIfTail, valueEnv, typeEnv, (elseBody, _, _, elseBodyTail) => {
                    success(IfExpr(condition, ifBody, elseBody, typeEnv.commonParent(ifBody.t, elseBody.t)),
                      valueEnv, typeEnv, elseBodyTail)
                  }, failure)
                }
                case _ => success(IfExpr(condition, ifBody, UnitExpr, typeEnv.commonParent(ifBody.t, UnitType)),
                  valueEnv, typeEnv, ifBodyTail)
              }
            }, failure)
          }
        }, failure)
      }

      // Loops
      case SymbolToken("repeat") :~: tail => parseLoop(tail, valueEnv, typeEnv, success, failure)

      // Functions and objects
      case SymbolToken("def") :~: tail => parseDefinition(tail, valueEnv, typeEnv, success, failure)

      // Blocks
      case PunctToken("{") :~: tail => parseUntil(tail, PunctToken("}"), valueEnv, typeEnv, success, failure)
      case PunctToken("(") :~: tail => parseUntil(tail, PunctToken(")"), valueEnv, typeEnv, success, failure)

      // References to Functions
      case SymbolToken(name) :~: PunctToken("(") :~: tail =>
        valueEnv.get(name) match {
          case Some(function : FunctionExpr) =>
            parseUntil(tail, PunctToken(")"), valueEnv, typeEnv, (params : Expr, newValueEnv : ValueEnv, newTypeEnv : TypeEnv, paramsTail : LiveStream[Token]) => {
              params match {
                case BlockExpr(xs : Seq[RefExpr]) =>
                  verifySimilarTypes(name, function.params, xs, typeEnv).map(failure)
                    .getOrElse(success(CallExpr(name, function.body.t, xs), newValueEnv, newTypeEnv, paramsTail))
                case xs => failure("Expected parameters for function call. Got " + xs)
              }
            }, failure)
          case _ => failure(Error.FUNCTION_NOT_FOUND(name))
        }

      // References to Operations
      case (firstToken : Token) :~: SymbolToken(functionName) :~: (secondToken : Token) :~: tail
        if valueEnv.get(functionName).filter(_.isInstanceOf[FunctionExpr])
          .exists(_.asInstanceOf[FunctionExpr].params.size == 2) =>
        val funExpr = valueEnv.get(functionName).get.asInstanceOf[FunctionExpr]
        val funParams = funExpr.params
        parse(LiveStream(Iterable(firstToken)), valueEnv, typeEnv, (firstParam, _, _, _) => {
          parse(LiveStream(Iterable(secondToken)), valueEnv, typeEnv, (secondParam, _, _, _) => {
            verifySimilarTypes(functionName, funExpr.params, Seq(firstParam, secondParam), typeEnv).map(failure)
              .getOrElse(success(CallExpr(functionName, funExpr.t, Seq(firstParam, secondParam)), valueEnv, typeEnv, tail))
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

      case stream if stream.isEmpty => success(UnitExpr, valueEnv, typeEnv, stream)

      case xs => failure(s"Unrecognised token pattern $xs")
    }
  }

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

  def parseLoop(tokens : LiveStream[Token], valueEnv : ValueEnv, typeEnv : TypeEnv, success: SuccessCont, failure: String => Value) : Value = {
    def parseValueToken(value : Token) : Either[String, Expr] = {
      value match {
        case SymbolToken(name) => valueEnv.get(name) match {
          case Some(f : FloatExpr) => Right(f)
          case Some(i : IntExpr) => Right(i)
          case Some(x) => Left(Error.TYPE_MISMATCH("numeric reference", x.toString))
          case None => Left(Error.REFERENCE_NOT_FOUND(name))
        }
        case IntToken(value: Int) => Right(IntExpr(value))
        case DoubleToken(value : Double) => Right(FloatExpr(value))
        case e => Left(Error.SYNTAX_ERROR("a numeric value or reference to a numeric value", e.toString))
      }
    }
    def parseLoopWithRange(counterName : String, fromToken : Token, toToken : Token, bodyTokens : LiveStream[Token], success: SuccessCont, failure: String => Value) : Value = {
      parseValueToken(fromToken).right.flatMap(from => {
        parseValueToken(toToken).right.flatMap(to => {
          parse(bodyTokens, valueEnv + (counterName -> from), typeEnv, (bodyExpr, _, _, bodyTail) => {
            success(LoopExpr(DefExpr(counterName, from), to, bodyExpr), valueEnv, typeEnv, bodyTail)
          }, failure)
        })
      })
    }

    tokens match {
      case fromToken :~: SymbolToken("to") :~: toToken :~: SymbolToken("using") :~: SymbolToken(counter) :~: tail =>
        parseLoopWithRange(counter, fromToken, toToken, tail, success, failure)

      case fromToken :~: SymbolToken("to") :~: toToken :~: tail =>
        parseLoopWithRange(DEFAULT_LOOP_COUNTER, fromToken, toToken, tail, success, failure)

      case toToken :~: SymbolToken("using") :~: SymbolToken(counter) :~: tail =>
        parseLoopWithRange(counter, IntToken(1), toToken, tail, success, failure)

      case toToken :~: tail =>
        parseLoopWithRange(DEFAULT_LOOP_COUNTER, IntToken(1), toToken, tail, success, failure)

      case tail => failure("Failed to parse loop. Expected to-token, got " + tail)
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

  def parseUntil(tokens: LiveStream[Token], token : Token, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure: FailureCont): Value = {
    parseUntil(parse, tokens, stream => stream.head.toString.equals(token.toString), valueEnv, typeEnv, success, failure)
  }

  def parseUntil(tokens: LiveStream[Token], condition : LiveStream[Token] => Boolean, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont): Value = {
    parseUntil(parse, tokens, condition, valueEnv, typeEnv, success, failure)
  }

  def parseUntil(parseFunction : (LiveStream[Token], ValueEnv, TypeEnv, SuccessCont, FailureCont) => Value, tokens: LiveStream[Token], condition : LiveStream[Token] => Boolean, valueEnv : ValueEnv, typeEnv : TypeEnv, success : SuccessCont, failure : FailureCont): Value = {
    var typeEnvVar : TypeEnv = typeEnv
    var valueEnvVar : ValueEnv = valueEnv
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