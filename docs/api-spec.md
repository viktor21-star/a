# REST API Спецификација

Base URL:

`/api/v1`

Authentication:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Authorization:

- JWT bearer token
- role + permission claims

## 1. Authentication

### POST /auth/login

Request:

```json
{
  "username": "pekara.aerodrom1",
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "refresh-token",
  "user": {
    "id": 15,
    "fullName": "Петар Петров",
    "role": "operator",
    "defaultLocationId": 3,
    "permissions": ["baking.plan.read", "baking.batch.write"],
    "allowedLocations": [
      {
        "locationId": 3,
        "locationName": "Аеродром 1",
        "canPlan": false,
        "canBake": true,
        "canRecordWaste": true,
        "canViewReports": false,
        "canApprovePlan": false
      }
    ]
  }
}
```

## 2. Шифарници

### GET /locations
### GET /ovens
### GET /items
### GET /item-groups
### GET /terms
### GET /shifts
### GET /waste-reasons
### GET /correction-reasons
### GET /users
### GET /users/{id}/locations
### PUT /users/{id}/locations

Интеграција:

### POST /integrations/master-data/sync
### GET /integrations/master-data/sync-runs

Правило:

- `Локации` и `Артикли` се полнат еднаш дневно од external source DB
- апликацијата ги чита локално од својата база по завршен sync
- source DB е `192.168.10.10,1443 / wtrg`
- `orged` = локации
- `katart` = артикли

Филтри:

- `search`
- `isActive`
- `locationId`
- `page`
- `pageSize`

## 3. План на печење

### GET /baking-plans

Query params:

- `date`
- `locationId`
- `shiftId`
- `status`

### POST /baking-plans/generate

Генерира header + lines според правила и историја.

### POST /baking-plans

Креира рачен план.

### GET /baking-plans/{planHeaderId}

### PUT /baking-plans/{planHeaderId}

### POST /baking-plans/{planHeaderId}/approve

### POST /baking-plans/{planLineId}/correct

Request:

```json
{
  "correctedQty": 42,
  "reasonId": 3,
  "note": "Зголемена побарувачка поради празник"
}
```

## 4. Реално печење

### GET /batches

Филтри:

- `date`
- `locationId`
- `shiftId`
- `termId`
- `itemId`
- `status`

### POST /batches/start

```json
{
  "planLineId": 821,
  "ovenId": 4,
  "startTime": "2026-03-16T05:55:00"
}
```

### POST /batches/{batchId}/finish

```json
{
  "actualQty": 36,
  "endTime": "2026-03-16T06:20:00",
  "note": "Нормален циклус"
}
```

### POST /batches/{batchId}/cancel

### GET /batches/{batchId}

## 5. Отпад

### GET /waste

Филтри:

- `dateFrom`
- `dateTo`
- `locationId`
- `itemId`
- `operatorId`
- `reasonId`

### POST /waste

```json
{
  "batchId": 9921,
  "locationId": 3,
  "shiftId": 1,
  "itemId": 77,
  "reasonId": 2,
  "quantity": 6,
  "recordedAt": "2026-03-16T14:10:00",
  "note": "Препечено"
}
```

## 6. Продажба

### GET /sales

Филтри:

- `dateFrom`
- `dateTo`
- `locationId`
- `itemId`

### POST /sales/imports

Endpoint за интеграција или batch ingestion.

### GET /sales/imports/{importId}

## 7. Анализа и dashboard

### GET /dashboard/overview

Response:

```json
{
  "date": "2026-03-16",
  "network": {
    "realizationPct": 94.5,
    "wastePct": 4.2,
    "salesPct": 88.1,
    "onTimePct": 91.4
  },
  "alertsOpen": 12,
  "topProblemItems": [],
  "topProblemLocations": []
}
```

### GET /dashboard/location/{locationId}

### GET /analytics/plan-vs-actual

### GET /analytics/baking-vs-sales

### GET /analytics/waste-by-item

### GET /analytics/waste-by-location

### GET /analytics/waste-by-operator

### GET /analytics/delay

### GET /analytics/shortage

### GET /analytics/overbaking

### GET /analytics/kpi-by-location

### GET /analytics/financial

## 8. Аларми

### GET /alerts

Филтри:

- `status`
- `severity`
- `locationId`
- `dateFrom`
- `dateTo`

### POST /alerts/{alertId}/acknowledge

### POST /alerts/{alertId}/resolve

## 9. Дисциплина

### GET /discipline-events

### POST /discipline-events

Се користи кога систем или менаџер регистрира дисциплински настан.

## 10. Извештаи

### GET /reports/plan-vs-actual
### GET /reports/baking-vs-sales
### GET /reports/waste-by-item
### GET /reports/waste-by-location
### GET /reports/waste-by-operator
### GET /reports/baking-delay
### GET /reports/shortage
### GET /reports/overbaking
### GET /reports/kpi-by-location
### GET /reports/financial

Секој report endpoint поддржува:

- `dateFrom`
- `dateTo`
- `locationId`
- `itemId`
- `shiftId`
- `termId`
- `format=json|excel|pdf`

## 11. Audit

### GET /audit-logs

Филтри:

- `entityName`
- `entityId`
- `userId`
- `dateFrom`
- `dateTo`

## 12. Стандарден Response Envelope

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 135
  },
  "errors": []
}
```

## 13. Error Codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_FORBIDDEN`
- `PLAN_NOT_FOUND`
- `PLAN_ALREADY_APPROVED`
- `BATCH_ALREADY_FINISHED`
- `WASTE_REASON_REQUIRED`
- `ALERT_NOT_FOUND`
- `EXPORT_FAILED`
