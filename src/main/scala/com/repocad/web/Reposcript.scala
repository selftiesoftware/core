package com.repocad.web

import com.repocad.reposcript.evaluating.Evaluator
import com.repocad.reposcript.lexing.Lexer
import com.repocad.reposcript.parsing.{Expr, ExprState, Parser}
import com.repocad.reposcript.{Renderer, evaluating, parsing}

/**
  * An entrypoint for reposcript.
  */
object Reposcript {

  private val parser = new Parser(Ajax, Environment.parserEnv, code => Lexer.lex(code, toLowerCase = true))
  private val evaluator = new Evaluator(parser, Environment.evaluatorEnv)

  def parse(code: String): parsing.Value[ExprState] = {
    parser.parse(code)
  }

  def evaluate(expr: Expr, renderer: Renderer): evaluating.Value = {
    evaluator.eval(expr, renderer)
  }

  def evaluate(code: String, renderer: Renderer): evaluating.Value = {
    evaluate(parse(code), renderer)
  }

  def evaluate(parsingOutput: parsing.Value[ExprState], renderer: Renderer): evaluating.Value = {
    parsingOutput.right.flatMap(t => evaluator.eval(t.expr, renderer)).left.map(_.toString)
  }
}