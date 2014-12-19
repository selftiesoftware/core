scalaJSSettings

name := "web"

version := "1.0"

scalaVersion := "2.11.2"

libraryDependencies += "org.scala-lang.modules.scalajs" %%% "scalajs-dom" % "0.6"

scalacOptions ++= Seq(
  "-Xlint",
  "-deprecation",
  "-Xfatal.warnings"
  )
