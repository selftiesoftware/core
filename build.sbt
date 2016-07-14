val commonSettings = Seq(
  organization := "com.repocad",
  version := "0.1-SNAPSHOT",
  normalizedName ~= {
    _.replace("scala-js", "scalajs")
  },
  homepage := Some(url("http://repocad.com/")),
  licenses +=("GPLv3", url("https://opensource.org/licenses/GPL-3.0")),
  scalaVersion := "2.11.8",
  scalacOptions ++= Seq(
    "-Xlint",
    "-deprecation",
    "-unchecked",
    "-feature",
    "-encoding", "utf8"
  )
)


lazy val reposcript = RootProject(uri("git://github.com/repocad/reposcript#feature-compile-pipeline"))

lazy val core = project.in(file("."))
  .settings(commonSettings: _*)
  .settings(
    name := "Repocad core",
    libraryDependencies ++= Seq(
      "org.scala-js" %%% "scalajs-dom" % "0.8.2",
      "org.scala-lang.modules" %% "scala-async" % "0.9.5",
      //"org.scala-lang.modules" %% "scala-xml" % "1.0.4",
      //"com.thoughtworks.binding" %% "core" % "2.0.1",
      "com.thoughtworks.binding" %%% "dom" % "2.0.1",
      //      "com.repocad" %% "reposcript" % "0.1-SNAPSHOT",
      "org.scalatest" %%% "scalatest" % "3.0.0-M15" % Test,
      "org.scalacheck" %%% "scalacheck" % "1.13.2" % Test
    ),
    resolvers += "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots",
    unmanagedJars in Compile := (Seq(Attributed.blank((packageBin in reposcript in Compile).value)))
  )
  .enablePlugins(ScalaJSPlugin)
  .dependsOn(reposcript)

