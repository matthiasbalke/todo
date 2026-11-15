$ErrorActionPreference = 'Stop'

docker compose --project-directory "$PSScriptRoot" --env-file "$PSScriptRoot/.env.dev" -f "$PSScriptRoot/compose.dev.yaml" @args
exit $LASTEXITCODE
