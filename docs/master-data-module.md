# Master Data Module

Прва реална имплементациска цел:

- `GET /api/v1/master-data/locations`
- `GET /api/v1/master-data/items`
- frontend screens за локации и артикли
- backend repository abstraction за SQL Server замена

Следни write операции за овој модул:

1. `POST /master-data/locations`
2. `PUT /master-data/locations/{id}`
3. `POST /master-data/items`
4. `PUT /master-data/items/{id}`
5. audit logging за сите промени
