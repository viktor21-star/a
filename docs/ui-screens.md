# UI Екрани

## 1. Визуелен правец

Стил:

- modern enterprise
- темно зелена примарна боја
- светла варијанта за дневна работа
- dark mode за позадини и dashboard wallboards

Препорачани токени:

- `--color-primary: #1F5A45`
- `--color-primary-strong: #163F31`
- `--color-accent: #8BBF9F`
- `--color-bg-light: #F4F7F5`
- `--color-surface: #FFFFFF`
- `--color-bg-dark: #0F1C17`
- `--color-card-dark: #162821`
- `--color-danger: #C55252`
- `--color-warning: #C58B2C`

Typography:

- `Manrope` или `IBM Plex Sans`
- големи броеви на KPI tiles
- јасна хиерархија за оперативни actions

UX принципи:

- без класичен ERP изглед
- cards пред tables
- filters in drawers
- touch targets најмалку 44px

## 2. Екран: Најава

Компоненти:

- бренд банер
- форма за најава
- избор на тема
- статус банер

## 3. Екран: Главен Dashboard

Ред 1:

- KPI tile `Реализација на план`
- KPI tile `% отпад`
- KPI tile `% продажба`
- KPI tile `% навремено печење`

Ред 2:

- chart `План vs Реално`
- chart `Печење vs Продажба`

Ред 3:

- card list `Топ проблематични артикли`
- card list `Топ проблематични локации`
- alert feed `Отворени аларми`

## 4. Екран: План на печење

Layout:

- left filter rail
- center term timeline
- right summary panel

Cards:

- term group card
- item planning card
- approval card

## 5. Екран: Реално печење

Layout:

- active tasks strip
- current batch card
- numeric keypad panel
- next planned batches panel

Состојби:

- `не започнато`
- `во тек`
- `завршено`
- `доцни`

## 6. Екран: Отпад

Layout:

- quick item selector
- large reason buttons
- quantity pad
- recent waste entries

## 7. Екран: Анализа

Tabs:

- План vs Реализација
- Печење vs Продажба
- Отпад
- Недостиг
- Препекување
- Доцнење

## 8. Екран: Аларми

Cards:

- severity badge
- location
- item
- cause
- acknowledge
- resolve

## 9. Екран: Извештаи

Report gallery:

- Дневен план vs реализација
- Печење vs продажба
- Отпад по артикал
- Отпад по локација
- Отпад по оператор
- Доцнење на печење
- Недостиг на производ
- Препекување
- KPI по локација
- Финансиска анализа

## 10. Екран: Администрација

Cards:

- Локации
- Печки
- Артикли
- Корисници
- Термини
- Смени
- Причини
- Аларм лимити
- Audit log
