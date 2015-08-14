package com.repocad.web

import com.repocad.reposcript.evaluating.Evaluator
import com.repocad.reposcript.lexing.Lexer
import com.repocad.reposcript.parsing.{Expr, Parser}
import com.repocad.reposcript.{Printer, evaluating, parsing}

/**
 * An entrypoint for reposcript.
 */
object Reposcript {

  private val parser = new Parser(Ajax, Environment.getParserEnv, parsing.defaultTypeEnv)
  private val evaluator = new Evaluator(parser)

  def parse(code : String) : parsing.Value = {
    val tokens = Lexer.lex(code)
    parser.parse(tokens)
  }

  def evaluate(expr : Expr, printer : Printer[_]) : evaluating.Value = {
    evaluator.eval(expr, printer)
  }

  def evaluate(code : String, printer : Printer[_]) : evaluating.Value = {
    evaluate(parse(code), printer)
  }

  def evaluate(parsingOutput : parsing.Value, printer : Printer[_]) : evaluating.Value = {
    parsingOutput.right.flatMap(t => evaluator.eval(t._1, printer))
  }

}
