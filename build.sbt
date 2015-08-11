name := "web"

version := "1.0"

scalaVersion := "2.11.7"

libraryDependencies += "org.scala-js" %%% "scalajs-dom" % "0.8.0"

libraryDependencies += "com.lihaoyi" %%% "scalarx" % "0.2.7"

libraryDependencies += "org.scalatest" % "scalatest_2.11" % "2.2.4" % Test

libraryDependencies += "org.scalamock" %% "scalamock-scalatest-support" % "3.2" % Test

scalacOptions ++= Seq(
  "-Xlint",
  "-deprecation"
  )

enablePlugins(ScalaJSPlugin)