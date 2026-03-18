# Development Setup

## Локално без Docker

Backend:

```bash
cd backend/Pecenje.Api
dotnet restore
dotnet run
```

Expected local URL:

```text
http://localhost:8081
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Локално со Docker

```bash
docker compose up --build
```

Services:

- frontend: `http://localhost:5173`
- api: `http://localhost:8081`
- sql server: `localhost:1433`

## Напомени

- API CORS е наместен за frontend на `5173`
- connection string е sample и мора да се смени за production
- `openapi.yaml` е почетна спецификација; реалната верзија треба да се одржува со CI
- frontend има demo auth guard и login screen за app flow основа
- локалните secrets може да стојат во `backend/Pecenje.Api/appsettings.Local.json`, кој не е во git
