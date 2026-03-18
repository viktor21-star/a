# Report export

Администраторот сега има работен web export за извештаи.

## Што е имплементирано

- `Excel` export за `План vs реализација`
- `PDF` export flow преку printable HTML документ

Backend:

- [backend/Pecenje.Api/Endpoints/ReportEndpoints.cs](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/Endpoints/ReportEndpoints.cs)
- [backend/Pecenje.Api/Application/Services/ReportingAppService.cs](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/Application/Services/ReportingAppService.cs)

Frontend:

- [frontend/src/pages/ReportsPage.tsx](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/pages/ReportsPage.tsx)

## Формат

- `Excel`: CSV download
- `PDF`: HTML document во нов tab, подготвен за `Print` / `Save as PDF`

## Следна фаза

Ако треба вистински бинарен `.pdf` фајл наместо print HTML, следен чекор е да се додаде PDF библиотека на backend или посебен document service.
