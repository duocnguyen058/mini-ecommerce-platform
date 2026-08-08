#!/bin/sh
# ---------------------------------------------------------------------------# --------------------------------------
# Maven Start Up Batch script
#
# Required ENV vars:
# ------------------
#   JAVA_HOME - location of a JDK home dir
#
# Optional ENV vars
# -----------------
#   M2_HOME - location of maven2's installed home dir
#   MAVEN_OPTS - parameters passed to the Java VM when running Maven
#     e.g. to debug Maven itself, use
#       set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
#   MAVEN_SKIP_RC - flag to disable loading of mavenrc files
# ----------------------------------------------------------------------------

if [ -z "$MAVEN_SKIP_RC" ] ; then
  if [ -f /etc/mavenrc ] ; then
    . /etc/mavenrc
  fi
  if [ -f "$HOME/.mavenrc" ] ; then
    . "$HOME/.mavenrc"
  fi
fi

# OS specific support
cygwin=false;
darwin=false;
mingw=false;
case "$(uname)" in
  CYGWIN*) cygwin=true ;;
  MINGW*) mingw=true ;;
  Darwin*) darwin=true
    if [ -z "$JAVA_HOME" ]; then
      if [ -x "/usr/libexec/java_home" ]; then
        JAVA_HOME="$(/usr/libexec/java_home)"; export JAVA_HOME
      fi
    fi
    ;;
esac

if [ -z "$JAVA_HOME" ] ; then
  if [ -r /etc/gentoo-release ] ; then
    JAVA_HOME=$(java-config --jre-home)
  fi
fi

if [ -z "$M2_HOME" ] ; then
  M2_HOME=~/.m2
fi

if [ -z "$MAVEN_OPTS" ] ; then
  MAVEN_OPTS=""
fi

# Provide a "standardized" way to retrieve the CLI args that will
# work with both Windows and non-Windows executions.
MAVEN_CMD_LINE_ARGS="$MAVEN_CONFIG $@"
export MAVEN_CMD_LINE_ARGS

wrapperJarPath="$M2_HOME/wrapper/dists/maven-wrapper-3.3.2.jar"
if [ -f "$wrapperJarPath" ]; then
  exec java $MAVEN_OPTS -jar "$wrapperJarPath" "$@"
fi

WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

# determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
  if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
    JAVACMD="$JAVA_HOME/jre/sh/java"
  else
    JAVACMD="$JAVA_HOME/bin/java"
  fi
  if [ ! -x "$JAVACMD" ] ; then
    echo "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME" >&2
    echo "Please set the JAVA_HOME variable in your environment to match the" >&2
    echo "location of your Java installation." >&2
    exit 1
  fi
else
  JAVACMD="java"
  which java >/dev/null 2>&1 || echo "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH." >&2
fi

exec "$JAVACMD" \
  $MAVEN_OPTS \
  -classpath "$wrapperJarPath" \
  "-Dmaven.home=$M2_HOME" \
  "-Dmaven.multiModuleProjectDirectory=$MAVEN_PROJECTBASEDIR" \
  $WRAPPER_LAUNCHER "$@"
