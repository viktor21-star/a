# SQL Server Persistence Plan

Подготвено во кодот:

- `ISqlConnectionFactory`
- `SqlConnectionFactory`
- `SqlServerMasterDataRepository`
- `SqlServerAuditLogRepository`
- SQL templates во `Infrastructure/SqlServer/SqlQueries`

Следно за целосна имплементација:

1. додади `Dapper` и `Microsoft.Data.SqlClient`
2. имплементирај `SqlConnectionFactory`
3. замени `DemoMasterDataRepository` со `SqlServerMasterDataRepository`
4. имплементирај `AuditLogs` write path
5. додај integration tests за `locations/items`

Зошто вака:

- application layer останува чист
- SQL е централизирано во query classes
- преминот од demo во real persistence ќе биде контролирана замена
