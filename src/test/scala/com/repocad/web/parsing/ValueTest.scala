package com.repocad.web.parsing

import com.repocad.web.lexing._
import com.repocad.web.parsing
import com.repocad.web.parsing.Parser._
import org.scalatest.EitherValues._
import org.scalatest.{FlatSpec, Matchers}

class ValueTest extends ParsingTest {

  "Value parsing" should "parse an integer" in {
    testEquals(IntExpr(1), "1")
  }
  it should "parse a string" in {
    testEquals(StringExpr("string"), "\"string\"")
  }
  it should "parse a double" in {
    testEquals(FloatExpr(123.42), "123.42")
  }
  it should "parse true to boolean" in {
    testEquals(BooleanExpr(value = true), "true")
  }
  it should "parse false to boolean" in {
    testEquals(BooleanExpr(value = false), "false")
  }

}
