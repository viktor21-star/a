# Master Data Write Flow

Имплементирано:

- `POST /api/v1/master-data/locations`
- `PUT /api/v1/master-data/locations/{locationId}`
- `POST /api/v1/master-data/items`
- `PUT /api/v1/master-data/items/{itemId}`

Frontend:

- форма за нова локација
- форма за нов артикал
- React Query mutations со invalidation

Следно:

1. field validation
2. edit modal/page за update flow
3. audit logging на create/update
4. SQL Server persistence
