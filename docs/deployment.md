# Deployment

## Production topologija

- `Frontend SPA` зад reverse proxy
- `ASP.NET Core API` service
- `SQL Server 2022`
- optional `Background worker` за аларми и imports

## Production checklist

- смени `JWT_KEY`
- смени `SQLSERVER_SA_PASSWORD`
- намести production connection string
- стави TLS сертификат
- овозможи centralized logging
- намести backup policy за SQL Server
- додади monitoring и alerting

## Recommended next infra tasks

- Kubernetes или VM deployment manifests
- secret store интеграција
- automated DB migration pipeline
- nightly backup verification
# Deployment

Поврзани production docs:

- [production-checklist.md](./production-checklist.md)
- [backup-and-restore.md](./backup-and-restore.md)
