val reposcript = RootProject(uri("git://github.com/repocad/reposcript"))

val project = Project("web", file("."))
  .settings(
    version := "1.0",
    scalaVersion := "2.11.7",
    scalacOptions ++= Seq(
      "-Xlint",
      "-deprecation"
    ),
    libraryDependencies ++= Seq(
      "org.scala-js" %%% "scalajs-dom" % "0.8.0",
      "org.scala-lang.modules" %% "scala-async" % "0.9.5",
      "com.thoughtworks.binding" %%% "core" % "2.0.1",
      "com.thoughtworks.binding" %%% "dom" % "1.0.5",
      "org.scalatest" % "scalatest_2.11" % "2.2.4" % Test,
      "org.scalamock" %% "scalamock-scalatest-support" % "3.2" % Test
    )
  )
  .enablePlugins(ScalaJSPlugin)
  .dependsOn(reposcript)