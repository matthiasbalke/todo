#!/usr/bin/env bash

# source: https://www.jvt.me/posts/2026/03/08/renovate-test-config/

# only test specific managers and files
export RENOVATE_ENABLED_MANAGERS=custom.regex
export RENOVATE_INCLUDE_PATHS=all-in-one/Dockerfile

# ensure that we have GitHub authentication at least, so we can fetch changelogs, and access GitHub-only dependencies
export RENOVATE_GITHUB_COM_TOKEN=$(gh auth token)
  # make sure we have the right level of information
export LOG_LEVEL=debug
  # also capture the logs in JSONL (newline-delimited JSON) format
#export RENOVATE_LOG_FILE=debug-$(date +%s).jsonl

# trace logging shows details about custom.regex manager version extraction
#export LOG_FILE=renovate-debug.jsonl
#export LOG_FILE_LEVEL=trace

  # use our Open Telemetry support (https://docs.renovatebot.com/opentelemetry/) to get additional insight into time taken / the flow of function calls
#export OTEL_EXPORTED_OTLP_ENDPOINT=http://localhost:4318
  # if I'm running from source code
  ## node lib/renovate.ts
  # or, more likely, running for a given version:
# a lot of the time, I'll use the local platform for ease, but often will run against a real Platform
bunx renovate --platform local --token ${RENOVATE_GITHUB_COM_TOKEN}
