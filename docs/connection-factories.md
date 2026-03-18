# Connection Factories

Во проектот сега има две одделни connection factories:

- `IAppSqlConnectionFactory`
- `ISourceSqlConnectionFactory`

Зошто:

- app DB и source DB се различни бази со различна намена
- operational write операции мора да одат само во app DB
- daily sync read операции мора да одат само во source DB

Source DB:

- `192.168.10.10:1443`
- `wtrg`
- `orged`
- `katart`

App DB:

- `ConnectionStrings:DefaultConnection`

Ова е правилната production поделба и го намалува ризикот од пишување во погрешна база.
