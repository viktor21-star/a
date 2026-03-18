# Daily Sync Model

## Одлука

- `Локации` и `Артикли` се внесуваат во базата на апликацијата преку daily sync
- не се одржуваат рачно како главен извор

## Source

- реална надворешна SQL Server база
- `Server: 192.168.10.10,1443`
- `Database: wtrg`
- `Locations table: orged`
- `Items table: katart`
- `Username: viktor_reader`
- password треба да се чува како secret, не во git

## Destination

- новата SQL Server база на апликацијата

## Frequency

- еднаш дневно

## Sync entities

- `Locations`
- `Items`

## Source mapping

- `orged` -> `Locations`
  - `Sifra_Oe` -> `Code` / `SourceLocationId`
  - `ImeOrg` -> `NameMk`
- `katart` -> `Items`
  - `Sifra_Art` -> `Code` / `SourceItemId`
  - `ImeArt` -> `NameMk`

## Flow

1. scheduler го стартува sync job
2. backend service чита records од source DB
3. прави upsert во `dbo.Locations` и `dbo.Items`
4. го пополнува `LastSyncedAt`
5. запишува run статистика во `dbo.MasterDataSyncRuns`

## User privileges

Корисниците не добиваат пристап глобално, туку по локација:

- операторот пополнува само на дозволените локации
- шеф на маркет гледа/одобрува само за своите локации
- регионален менаџер има група локации

## Што останува локално во app DB

- users
- user-location privileges
- baking plans
- batches
- waste
- sales imports
- alerts
- KPI snapshots
- audit logs
