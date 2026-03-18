# APK release process

За нова верзија без Play Store:

1. изгради нов `APK`
2. пушти ја helper скриптата:
   - `bash "/home/zitomarketi/Desktop/Pecenje app/scripts/publish_latest_apk.sh"`
   - за задолжителен update: `bash "/home/zitomarketi/Desktop/Pecenje app/scripts/publish_latest_apk.sh" true`
3. скриптата автоматски:
   - го наоѓа најновиот `app-debug.apk` или последниот zip artifact во `~/Downloads`
   - го копира во `backend/Pecenje.Api/wwwroot/downloads/app-debug.apk`
   - ги ажурира `LatestVersion`, `BuildNumber`, `ReleasedAt` и `ForceUpdate` во [backend/Pecenje.Api/appsettings.json](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/appsettings.json)

## Што се менува во config

Во `AppVersioning`:

- `MinimumSupportedVersion`
- `LatestVersion`
- `BuildNumber`
- `ReleasedAt`
- `ForceUpdate`
- `DownloadUrl`
- `MessageMk`

## Пример

```json
"AppVersioning": {
  "MinimumSupportedVersion": "1.0.1",
  "LatestVersion": "1.0.1",
  "BuildNumber": "101",
  "ReleasedAt": "2026-03-19T08:00:00Z",
  "ForceUpdate": true,
  "DownloadUrl": "/downloads/app-debug.apk",
  "MessageMk": "Инсталирај ја новата верзија за да продолжиш со работа."
}
```

## Резултат

- старата верзија ќе се блокира
- корисникот ќе ја види новата верзија, build и датум
- ќе добие download линк кон новиот APK
