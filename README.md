# Pecenje Evidencija

Во ова репо постојат:

- почетен локален прототип со `Python + SQLite`
- enterprise спецификација за целосен систем со `REST API + SQL Server + React`

## Enterprise документација

- архитектура: [docs/enterprise-architecture.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/enterprise-architecture.md)
- база: [docs/database-schema.sql](/home/zitomarketi/Desktop/Pecenje%20app/docs/database-schema.sql)
- API: [docs/api-spec.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/api-spec.md)
- UI екрани: [docs/ui-screens.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/ui-screens.md)
- roadmap: [docs/implementation-roadmap.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/implementation-roadmap.md)
- development setup: [docs/development-setup.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/development-setup.md)
- backend next steps: [docs/backend-next-steps.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/backend-next-steps.md)
- master data module: [docs/master-data-module.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/master-data-module.md)
- master data write flow: [docs/master-data-write-flow.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/master-data-write-flow.md)
- sql server persistence plan: [docs/sqlserver-persistence-plan.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/sqlserver-persistence-plan.md)
- daily sync model: [docs/daily-sync-model.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/daily-sync-model.md)
- user location permissions module: [docs/user-location-permissions-module.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/user-location-permissions-module.md)
- user access sql plan: [docs/user-access-sql-plan.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/user-access-sql-plan.md)
- connection factories: [docs/connection-factories.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/connection-factories.md)
- location access enforcement: [docs/location-access-enforcement.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/location-access-enforcement.md)
- daily sync worker: [docs/daily-sync-worker.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/daily-sync-worker.md)
- manual sync ui: [docs/manual-sync-ui.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/manual-sync-ui.md)
- pekara and pecenjara permissions: [docs/pekara-pecenjara-permissions.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/pekara-pecenjara-permissions.md)
- android apk install: [docs/android-apk-install.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/android-apk-install.md)
- github actions apk: [docs/github-actions-apk.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/github-actions-apk.md)
- android release signing: [docs/android-release-signing.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/android-release-signing.md)
- report export: [docs/report-export.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/report-export.md)
- force update without play: [docs/force-update-without-play.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/force-update-without-play.md)
- apk release process: [docs/apk-release-process.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/apk-release-process.md)
- native android updater: [docs/native-android-updater.md](/home/zitomarketi/Desktop/Pecenje%20app/docs/native-android-updater.md)

## Production skeleton

- backend: [backend/Pecenje.Api/Program.cs](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/Program.cs)
- frontend: [frontend/src/App.tsx](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/App.tsx)

Backend структура:

- `backend/Pecenje.Api`
- minimal API bootstrap
- endpoint groups за auth, dashboard, planning, batches, waste, reports
- contracts и OpenAPI основа
- Dockerfile за API
- app service registration, demo auth service и domain enums

Frontend структура:

- `frontend`
- React + TypeScript + Vite setup
- enterprise shell
- dashboard, planning, production, reports screens
- working light/dark theme foundation
- Dockerfile и централен API client
- auth provider, route guard и login page

Source sync:

- source SQL Server: `192.168.10.10,1443`
- source DB: `wtrg`
- source user: `viktor_reader`
- `orged` -> locations (`Sifra_Oe`, `ImeOrg`)
- `katart` -> items (`Sifra_Art`, `ImeArt`)
- policy: еднаш дневно се полнат во локалната база на апликацијата

## Тековен прототип

Локалниот прототип е во:

- [server.py](/home/zitomarketi/Desktop/Pecenje%20app/server.py)
- [index.html](/home/zitomarketi/Desktop/Pecenje%20app/index.html)
- [app.js](/home/zitomarketi/Desktop/Pecenje%20app/app.js)

Старт:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app"
python3 server.py
```

Потоа отвори:

```text
http://localhost:8080
```

## Следна фаза

Ако сакаш, следно можам да изработам и:

1. production project skeleton со `React + ASP.NET Core`
2. SQL Server migration scripts
3. wireframe screens во HTML/React
4. OpenAPI YAML спецификација

## Local run

Backend:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/backend/Pecenje.Api"
/snap/bin/dotnet run
```

Frontend:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
/snap/bin/npm run dev -- --host 0.0.0.0
```

Expected local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8081`

Helper scripts:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/build_all.sh"
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/run_backend.sh"
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/run_frontend.sh"
```
