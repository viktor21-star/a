#!/usr/bin/env bash
set -euo pipefail

cd "/home/zitomarketi/Desktop/Pecenje app/backend/Pecenje.Api"
/snap/bin/dotnet restore
/snap/bin/dotnet build
