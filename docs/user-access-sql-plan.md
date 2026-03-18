# User Access SQL Plan

Подготвено:

- `UserAccessSql`
- `SqlServerUserAccessRepository`
- `SyncRunSql`
- `SqlServerMasterDataSyncRunRepository`

Следно:

1. Dapper имплементација за `Users` и `UserLocations`
2. real persistence за update на привилегии
3. sync run logging при дневен import
4. endpoint authorization policy за admin only пристап
