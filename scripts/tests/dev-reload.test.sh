#!/usr/bin/env zsh
# Integration test of the actual development Gradle task, using an offline Java fixture.
# Requires the development backend image and its populated Gradle wrapper cache.
set -euo pipefail
repo_root="${0:A:h:h:h}"
test_root="$(mktemp -d)"
container_name="todo-dev-reload-test-$$"
cleanup() {
  docker rm -f "$container_name" > /dev/null 2>&1 || true
  rm -rf "$test_root"
}
trap cleanup EXIT
mkdir -p "$test_root/src/main/java" "$test_root/src/main/resources" "$test_root/gradle"
cp "$repo_root/backend/gradle/dev.gradle.kts" "$test_root/gradle/dev.gradle.kts"
print 'rootProject.name = "reload-fixture"' > "$test_root/settings.gradle.kts"
cat > "$test_root/build.gradle.kts" <<'GRADLE'
plugins { java }
tasks.register<JavaExec>("bootRun")
apply(from = "gradle/dev.gradle.kts")
GRADLE
print 'class Example { int value() { return 1; } }' > "$test_root/src/main/java/Example.java"
print first > "$test_root/src/main/resources/example.txt"

docker run --rm -d --name "$container_name" \
  -v "$test_root:/workspace/backend" \
  -v "${GRADLE_CACHE_VOLUME:-todo-dev_gradle-cache}:/home/developer/.gradle" \
  "${DEV_BACKEND_IMAGE:-todo-dev-backend}" \
  /opt/gradle-wrapper/gradlew --offline --console=plain devReload --continuous > /dev/null

wait_for_log() {
  local expected="$1"
  for attempt in {1..120}; do
    if [[ "$(docker logs "$container_name" 2>&1)" == *"$expected"* ]]; then
      return
    fi
    sleep 0.5
  done
  docker logs "$container_name"
  print -u2 -- "Timed out waiting for: $expected"
  exit 1
}
wait_for_trigger_change() {
  local previous="$1"
  for attempt in {1..120}; do
    if [[ -s "$test_root/build/devtools/.reloadtrigger" && "$(<"$test_root/build/devtools/.reloadtrigger")" != "$previous" ]]; then
      return
    fi
    sleep 0.5
  done
  docker logs "$container_name"
  print -u2 'Timed out waiting for a successful-build trigger update'
  exit 1
}
wait_for_log 'Waiting for changes'
first_trigger="$(<"$test_root/build/devtools/.reloadtrigger")"
print 'class Example { int value() { return 2; } }' > "$test_root/src/main/java/Example.java"
wait_for_trigger_change "$first_trigger"
second_trigger="$(<"$test_root/build/devtools/.reloadtrigger")"
print second > "$test_root/src/main/resources/example.txt"
wait_for_trigger_change "$second_trigger"
[[ "$(<"$test_root/build/resources/main/example.txt")" == second ]]
resource_trigger="$(<"$test_root/build/devtools/.reloadtrigger")"
print 'class Example { deliberately invalid Java }' > "$test_root/src/main/java/Example.java"
wait_for_log 'BUILD FAILED'
[[ "$(<"$test_root/build/devtools/.reloadtrigger")" == "$resource_trigger" ]]
print 'class Example { int value() { return 3; } }' > "$test_root/src/main/java/Example.java"
wait_for_trigger_change "$resource_trigger"
recovered_trigger="$(<"$test_root/build/devtools/.reloadtrigger")"
sleep 3
[[ "$(<"$test_root/build/devtools/.reloadtrigger")" == "$recovered_trigger" ]]
print 'Continuous compilation, resources, failure recovery, and stable restart trigger verified'
