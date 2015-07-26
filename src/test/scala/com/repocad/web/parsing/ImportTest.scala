package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing
import com.repocad.web.parsing.Parser._
import org.scalatest.EitherValues._
import org.scalatest.{FlatSpec, Matchers}

class ImportTest extends FlatSpec with Matchers {

  val mockSuccess : SuccessCont = (e, v, t, s) => Right(e, v, t)
  val mockFailure : FailureCont = s => Left(s)

  def testEquals(expected : Expr, expression : String) = {
    val either = parseString(expression, Map(), parsing.typeEnv)
    println("output: ", either)
    either.right.value._1 should equal(expected)
  }

  def parseString(string : String, valueEnv : ValueEnv = Map(), typeEnv : TypeEnv = Map()) : Value = {
    val stream = Lexer.lex(string)
    Parser.parse(stream, valueEnv, typeEnv, (t, vEnv, tEnv, _) => Right((t, vEnv, tEnv)), f => Left(f))
  }

// Test with injected connections
//  "Import parsing" should "parse an import statement" in {
//    testEquals(ImportExpr("a"), "import default")
//  }

}
