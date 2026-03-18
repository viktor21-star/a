# Enterprise Архитектура: Контрола на Печење

## 1. Цел

Системот обезбедува централизирана контрола на:

- планирано печење
- реално печење по тура
- продажба од POS
- отпад
- разлики и дисциплина
- KPI и менаџерски извештаи

Системот е дизајниран за:

- 100+ локации
- 1000+ артикли
- повеќе улоги
- touch-first tablet интерфејс
- web enterprise backoffice

## 2. Предложена Архитектура

### 2.1 Logical Architecture

Слоеви:

- `Frontend Web App`
- `Tablet Operational UI`
- `REST API / Application Layer`
- `Integration Layer`
- `SQL Server Database`
- `Analytics / Reporting Layer`
- `Audit & Monitoring`

### 2.2 Technology Stack

Frontend:

- `React + TypeScript`
- `Vite`
- `TanStack Query`
- `React Router`
- `Zustand` или `Redux Toolkit`
- `AG Grid` само каде е неопходно, инаку card/grid UX
- `ECharts` или `Apache Superset embed` за KPI графици

Design system:

- custom enterprise design system
- македонски јазик, кирилица
- light/dark theme
- touch-friendly components

Backend:

- `ASP.NET Core Web API`
- `MediatR` или clean service layer
- `FluentValidation`
- `Serilog`
- `Hangfire` или `Quartz.NET` за jobs/аларми

Database:

- `Microsoft SQL Server`
- row versioning
- partitioning по датум за големи transactional табели

Integrations:

- POS import service
- daily master data sync from external retail DB
- optional ERP/commercial system sync

Reporting:

- API aggregated endpoints
- export service за Excel/PDF

Authentication:

- JWT + refresh token
- RBAC + permission matrix
- optional Active Directory / Azure AD интеграција

## 3. Deployment Architecture

### 3.1 Production Topology

- `Web Frontend` на IIS/Nginx
- `API Service` на application server
- `SQL Server` на посебен DB server
- `Background Jobs Service`
- `File/Export Service`
- `Monitoring` со Grafana/Prometheus или Azure Monitor

### 3.2 Environments

- DEV
- TEST/UAT
- PROD

### 3.3 Scalability

API:

- stateless horizontal scaling
- distributed cache за reference data и dashboards

DB:

- indexes за location/date/item queries
- summary/materialized reporting tables
- ETL за heavy analytics

## 4. Domain Modules

### 4.1 Шифарници

- локации
- печки
- артикли
- групи на артикли
- термини на печење
- смени
- корисници
- причини за отпад
- причини за корекција
- лимити за KPI/аларми

Правило:

- `Локации` и `Артикли` не се одржуваат рачно како примарен извор во апликацијата
- тие се синхронизираат еднаш дневно од надворешната реална база во базата на апликацијата
- апликацијата потоа работи врз сопствената локална operational база

### 4.2 План на печење

Функции:

- креирање дневен план по локација/смена/термин
- auto-suggestion според историја, продажба, сезоналност
- корекција од шеф/централа
- одобрување
- статусирање

### 4.3 Реално печење

Функции:

- batch/toura евиденција
- start/end time
- оператор
- внес на количина
- корекција со reason code

### 4.4 Отпад

Функции:

- задолжителен внес
- quantity + reason
- врска со batch или артикал/смена
- вредносна пресметка

### 4.5 Продажба

Функции:

- автоматски POS import
- агрегирање по артикал/локација/ден/час
- reconciliation checks

### 4.6 Анализа и дисциплина

Функции:

- план vs печење
- печење vs продажба
- продажба vs остаток
- отпад%
- навремено печење%
- доцнење
- дисциплински настани и ескалации

### 4.7 Извештаи и dashboard

- KPI dashboard
- оперативен dashboard
- менаџерски dashboard
- exports

## 5. Кориснички Улоги

### 5.1 Оператор / пекар

Може:

- да гледа дневен план за своја локација
- да стартува/затвора печење
- да внесе реално печење
- да внесе отпад
- да гледа свои задачи и аларми
- да внесува само за локации за кои има експлицитна дозвола

### 5.2 Шеф на маркет

Може:

- да коригира план
- да одобрува корекции
- да следи реализација на маркет
- да гледа дисциплински настани

### 5.3 Регионален менаџер

Може:

- да гледа повеќе локации
- да анализира KPI
- да гледа топ проблематични локации/артикли

### 5.4 Централа / комерција

Може:

- да дефинира master data
- да генерира предлог план
- да гледа цела мрежа
- да следи комерцијални KPI и финансиска анализа

### 5.5 Администратор

Може:

- управување со корисници и права
- системски параметри
- интеграции
- audit преглед

### 5.6 Привилегии по локација

Покрај улогата, секој корисник има assignment по локација.

Табела:

- `UserLocations`

Права по локација:

- `CanPlan`
- `CanBake`
- `CanRecordWaste`
- `CanViewReports`
- `CanApprovePlan`

## 6. UI / UX Екрани

## 6.1 Login

Секции:

- бренд header
- најава
- избор на light/dark mode
- известувања за аларми/статус

## 6.2 Home Dashboard

Widgets:

- реализација на план денес
- % отпад денес
- % навремено печење
- продажба од испечено
- аларми денес
- топ 5 проблематични артикли
- топ 5 проблематични локации

UX:

- card-based layout
- големи touch KPI tiles
- drilldown по клик

## 6.3 План на печење

Екран:

- timeline cards по термин
- групирање по смена
- card per артикал

Card fields:

- артикал
- предложено
- планирано
- коригирано
- статус
- одобрен од

Actions:

- коригирај
- одобри
- прескокни
- означи како во тек

## 6.4 Реално печење

Екран:

- активни тури
- старт/стоп копчиња
- touch numeric keypad за количина
- избор на артикал
- забелешка

Card fields:

- артикал
- термин
- печка
- оператор
- време почеток
- време крај
- количина
- статус batch

## 6.5 Отпад

Екран:

- големи картички за reason selection
- брз внес по артикал
- optional scan/barcode mode

## 6.6 Продажба и анализа

Екран:

- cards со summary
- charts за печење vs продажба
- heatmap по термин
- проблеми по артикал

## 6.7 Дисциплина / аларми

Екран:

- alert cards по severity
- SLA status
- acknowledged/resolved flow

## 6.8 Извештаи

Екран:

- report gallery
- filter drawer
- chart + card summary + detail grid
- export actions: Excel, PDF

## 6.9 Администрација

Екрани:

- локации
- артикли
- термини
- корисници
- лимити/аларми
- audit log viewer

## 7. Навигација

Главно мени:

- Dashboard
- План на печење
- Реално печење
- Отпад
- Продажба
- Анализа
- Аларми
- Извештаи
- Шифарници
- Администрација

Tablet quick actions:

- старт печење
- заврши печење
- внеси отпад
- прегледај следен термин

## 8. Business Rules

### 8.1 План

- секој артикал може да има повеќе термини дневно
- коригирана количина ја надминува предложената само со reason
- одобрување задолжително за критични корекции

### 8.2 Реално печење

- batch мора да има start time
- end time не смее да е пред start time
- quantity = 0 не е дозволено за завршен batch

### 8.3 Отпад

- отпад мора да има причина
- отпад може да биде поврзан со batch или директно со артикал/смена

### 8.4 Аларми

- `not-started-on-time`: нема старт до X минути пред/по термин
- `underbaked`: реално < план * праг
- `overbaked`: реално > план * праг
- `waste-limit-exceeded`: отпад% > праг
- `sold-out-too-early`: продажба довела до shortage пред следен термин

## 9. KPI Дефиниции

- `% реализација на план = реално испечено / коригирано планирано * 100`
- `% отпад = отпад / реално испечено * 100`
- `% продажба од испечено = продадено / реално испечено * 100`
- `% недостиг = max(продадено - испечено, 0) / продадено * 100`
- `% навремено печење = batch-ови започнати во дозволен прозорец / вкупно batch-ови * 100`

## 10. Data Flow

1. Daily sync job ги влече `Локации` и `Артикли` од external retail DB.
2. Податоците се upsert-ираат во базата на апликацијата.
3. Администратор доделува корисници и привилегии по локација.
4. Централа/шеф генерира дневен план.
5. Оператор гледа план само за дозволените локации.
6. Оператор стартува batch и внесува реална количина.
7. POS интеграција увезува продажба.
8. Оператор/шеф внесува отпад.
9. Analytics service пресметува KPI, разлики и аларми.
10. Dashboard и извештаи читаат од агрегирани view/table.

## 10.1 Daily Master Data Sync

Се синхронизира еднаш дневно:

- `Locations`
- `Items`

Механизам:

- scheduled job во backend
- source DB reader
- upsert во локалната база на апликацијата
- log во `MasterDataSyncRuns`

Одлука:

- апликацијата е system of record за оперативните процеси
- external retail DB е source of truth за локации и артикли

## 11. Audit & Logging

Секоја промена мора да логира:

- entity
- entity id
- action
- old value
- new value
- changed by
- changed at
- source device
- correlation id

## 12. Security

- role-based access control
- API authorization policies
- encrypted transport TLS
- password policy / SSO option
- audit trail immutable append-only
- export permissions by role

## 13. Recommended Micro Boundaries

За прва фаза препорака е `modular monolith`.

Модули:

- Identity
- MasterData
- Planning
- Production
- Waste
- SalesIntegration
- Analytics
- Reporting
- Alerts
- Audit

Подоцна можат да се издвојат како services ако обемот порасне.
