scalaJSSettings

name := "web"

version := "1.0"

scalaVersion := "2.11.2"

libraryDependencies += "org.scala-lang.modules.scalajs" %%% "scalajs-dom" % "0.6"

libraryDependencies += "org.scalatest" %% "scalatest" % "2.2.1" % "test"

scalacOptions ++= Seq(
  "-Xlint",
  "-deprecation"
  )

// Needed to avoid sbt from hanging on JDK8: https://github.com/scala-js/scala-js/issues/1140
ScalaJSKeys.parallelFastOptJS := false
