# Source Sync And Permissions

## Source систем

- SQL Server: `192.168.10.10,1443`
- Database: `wtrg`
- User: `viktor_reader`
- `orged` = локации
- `katart` = артикли

Лозинката не треба да стои во git; треба да се внесе преку secret/env/config override.

## Што оди во app базата

Од source DB еднаш дневно се полнат:

- `Locations`
- `Items`

Мапирање потврдено за `orged`:

- `Sifra_Oe` -> шифра на локација
- `ImeOrg` -> име на локација

Мапирање потврдено за `katart`:

- `Sifra_Art` -> шифра на артикал
- `ImeArt` -> име на артикал

За `katart` уште треба точна листа на колоните за:

- група
- цена
- активен/неактивен статус

Во app базата локално се чува:

- users
- user-location privileges
- baking plans
- batches
- waste
- sales
- alerts
- KPI snapshots
- audit logs

## Привилегии по локација

Табела:

- `UserLocations`

Права:

- `CanPlan`
- `CanBake`
- `CanRecordWaste`
- `CanViewReports`
- `CanApprovePlan`

## Правило

- корисникот пополнува само за локации што му се доделени
- улогата сама по себе не е доволна без location assignment
