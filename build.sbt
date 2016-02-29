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
      "org.scala-js" %%% "scalajs-dom" % "0.8.2",
      "org.scala-lang.modules" %% "scala-async" % "0.9.5",
      //"org.scala-lang.modules" %% "scala-xml" % "1.0.4",
      //"com.thoughtworks.binding" %% "core" % "2.0.1",
      "com.thoughtworks.binding" %%% "dom" % "2.0.1",
      "org.scalatest" % "scalatest_2.11" % "2.2.4" % Test,
      "org.scalamock" %% "scalamock-scalatest-support" % "3.2" % Test
    ),
    jsDependencies ++= Seq(
      ProvidedJS / "jspdf.min.js",
      ProvidedJS / "opentype.min.js"
    ),
    addCompilerPlugin("org.scalamacros" % "paradise" % "2.1.0" cross CrossVersion.full)
  )
  .enablePlugins(ScalaJSPlugin)
  .dependsOn(reposcript)

