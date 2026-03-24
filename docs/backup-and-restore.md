# Backup And Restore

Локалната оперативна база е:

```text
/home/zitomarketi/Desktop/Pecenje app/backend/Pecenje.Api/App_Data/pecenje-local.db
```

Во оваа база се чуваат:

- корисници
- привилегии
- активни локации
- планови
- печки
- термини
- причини
- операторски внесови
- отпад

## Backup

Пушти:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/backup_local_db.sh"
```

Backup фајловите се снимаат во:

```text
/home/zitomarketi/Desktop/Pecenje app/backups
```

Формат:

```text
pecenje-local-YYYYMMDD-HHMMSS.db.gz
```

Скриптата:

- прави timestamp backup
- го gzip-компресира
- ги задржува последните 14 backups

## Restore

Пред restore:

1. стопирај backend
2. одбери точен backup

Стопирај:

```bash
systemctl --user stop pecenje-backend.service
```

Restore:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/restore_local_db.sh" pecenje-local-YYYYMMDD-HHMMSS.db.gz
```

Или со апсолутна патека:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/restore_local_db.sh" "/home/zitomarketi/Desktop/Pecenje app/backups/pecenje-local-YYYYMMDD-HHMMSS.db.gz"
```

После restore:

```bash
systemctl --user start pecenje-backend.service
```

## Проверка После Restore

Пушти:

```bash
curl http://127.0.0.1:8081/health
```

И потоа провери во апликацијата:

- login
- корисници
- локации
- планови
- внесови
- отпад

## Препорака

Пред секоја поголема промена прави backup:

- пред build/redeploy
- пред чистење на податоци
- пред промени во SQLite schema
- пред production пуштање
