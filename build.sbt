name := "web"

version := "1.0"

scalaVersion := "2.11.2"

libraryDependencies += "org.scalatest" %% "scalatest" % "2.2.1" % "test"

libraryDependencies += "org.scala-js" %%% "scalajs-dom" % "0.8.0"

libraryDependencies += "com.lihaoyi" %%% "scalarx" % "0.2.7"

scalacOptions ++= Seq(
  "-Xlint",
  "-deprecation"
  )

enablePlugins(ScalaJSPlugin)