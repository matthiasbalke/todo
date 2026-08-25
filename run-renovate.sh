#!/usr/bin/env bash

# ensure that we have GitHub authentication at least, so we can fetch changelogs, and access GitHub-only dependencies
export RENOVATE_GITHUB_COM_TOKEN=$(gh auth token)
  # make sure we have the right level of information
export LOG_LEVEL=debug
  # also capture the logs in JSONL (newline-delimited JSON) format
export RENOVATE_LOG_FILE=debug-$(date +%s).jsonl
  # use our Open Telemetry support (https://docs.renovatebot.com/opentelemetry/) to get additional insight into time taken / the flow of function calls
#export OTEL_EXPORTED_OTLP_ENDPOINT=http://localhost:4318
  # if I'm running from source code
  ## node lib/renovate.ts
  # or, more likely, running for a given version:
bunx renovate --platform local
# a lot of the time, I'll use the local platform for ease, but often will run against a real Platform
