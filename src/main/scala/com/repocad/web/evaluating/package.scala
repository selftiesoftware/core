package com.repocad.web

import com.repocad.web.evaluating.Evaluator.Value

/**
 * The evaluating package contains code to execute the Abstract Syntax Tree (AST) from the 
 * [[com.repocad.web.parsing.Parser]], on the medium given to the [[com.repocad.web.evaluating.Evaluator]].
 */
package object evaluating {

  object Error {
    def OBJECT_PARAM_EVAL_ERROR(name: String, lefts: Seq[Value]): String =
      s"Failed to evaluate ${lefts.size} parameters when creating object '$name': $lefts"


    def OBJECT_PARAM_SIZE_NOT_EQUAL(objectName : String, expectedParams : Int, actualParams : Int) = 
      s"Object '$objectName' requires $expectedParams parameters, but was given $actualParams"
    
  }
  
}
