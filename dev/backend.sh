#!/usr/bin/env zsh
set -euo pipefail
source /workspace/dev/container-env.sh
[[ -r /e2e-certs/e2e-truststore.p12 ]] || fail_config 'missing e2e/certs/e2e-truststore.p12'

# Preserve public CA trust for Gradle/HTTPS while reusing the existing Mailpit CA.
truststore=/tmp/todo-dev-truststore.p12
rm -f "$truststore"
keytool -importkeystore -noprompt -srckeystore "$JAVA_HOME/lib/security/cacerts" \
  -srcstorepass changeit -destkeystore "$truststore" -deststorepass changeit \
  -deststoretype PKCS12 > /dev/null 2>&1
keytool -importkeystore -noprompt -srckeystore /e2e-certs/e2e-truststore.p12 \
  -srcstorepass changeit -destkeystore "$truststore" -deststorepass changeit \
  -deststoretype PKCS12 > /dev/null 2>&1
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Djavax.net.ssl.trustStore=${truststore} -Djavax.net.ssl.trustStorePassword=changeit -Djavax.net.ssl.trustStoreType=PKCS12"

gradle_cmd=(/opt/gradle-wrapper/gradlew -PcomposeDev --console=plain)
"${gradle_cmd[@]}" devReload

# Gradle's continuous mode remains alive with closed stdin; no TTY is required.
"${gradle_cmd[@]}" devReload --continuous < /dev/null &
compiler_pid=$!
"${gradle_cmd[@]}" bootRun < /dev/null &
application_pid=$!

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  kill "$compiler_pid" "$application_pid" 2>/dev/null || true
  wait "$compiler_pid" 2>/dev/null || true
  wait "$application_pid" 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

while kill -0 "$compiler_pid" 2>/dev/null && kill -0 "$application_pid" 2>/dev/null; do
  sleep 1
done
print -u2 'A backend development process exited; stopping the service. Check the preceding logs.'
exit 1
