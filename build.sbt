import java.io.FileOutputStream

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

/**
  * Pulls a given git project into the target directory and returns the source folder
  * (assumed to be in base/src/main).
  *
  * @param url             The complete url to the project
  * @param targetDirectory The directory to clone the project into
  * @param branch          The branch to clone (defaults to "master")
  * @return The source directory of the project.
  */
def getGitSources(url: String, targetDirectory: String, branch: Option[String] = None): File = {
  def execute(command: String): Unit = {
    Process(command).#>(new FileOutputStream("/dev/null")).run().exitValue() match {
      case 0 => // Do nothing
      case errorCode => throw new RuntimeException(s"Non-zero exit code ($errorCode) when executing '$command'")
    }
  }
  val targetFile = new File(targetDirectory)
  if (targetFile.isDirectory) {
    val gitDir = s"--git-dir $targetDirectory/.git"
    execute(s"git $gitDir fetch origin")
    execute(s"git $gitDir checkout ${branch.getOrElse("master")}")
  } else {
    val branchName = branch.map(branchName => s"--branch $branchName").getOrElse("")
    execute(s"git clone $url $branchName $targetDirectory")
  }
  targetFile / "src" / "main"
}

lazy val reposcriptSourceDirectory = getGitSources("git@github.com:repocad/reposcript", "/tmp/reposcript", Some("feature-compile-pipeline"))

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
    unmanagedSourceDirectories in Compile += {
      reposcriptSourceDirectory
    }
  )
  .enablePlugins(ScalaJSPlugin)
