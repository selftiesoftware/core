package com.repocad.printer

import org.scalatest.{BeforeAndAfter, FlatSpec, Matchers}

class PsPrinterTest extends FlatSpec with Matchers with BeforeAndAfter {

  var printer = new PsPrinter()

  before {
    printer = new PsPrinter
  }

  "A ps printer" should "print an empty string" in {
    printer.context.mkString should equal("")
  }
  //  it "should print a line" in {

  //  }

}
