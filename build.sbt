name := "web"

version := "1.0"

scalaVersion := "2.11.5"

libraryDependencies += "org.scala-js" %%% "scalajs-dom" % "0.8.0"

libraryDependencies += "org.scalatest" %% "scalatest" % "2.2.1" % "test"

scalacOptions ++= Seq(
  "-Xlint",
  "-deprecation"
  )

enablePlugins(ScalaJSPlugin)
