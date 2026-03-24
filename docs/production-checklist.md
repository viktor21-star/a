# Production Checklist

Ова е кратка checklist листа пред реално пуштање на `Печење`.

Системот моментално работи на:

- web: `https://app.superpetka.com/`
- API: `https://app.superpetka.com/api/v1`
- локален backend: `http://127.0.0.1:8081`

## 1. Build

Пушти:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/backend/Pecenje.Api"
dotnet build
```

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
npm run build
```

Ако било кој build падне:

- прво среди ја првата грешка
- не продолжувај со restart додека build не е чист

## 2. Services

Инсталирај/освежи ги user services:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/install_systemd_user_services.sh"
```

Стартувај:

```bash
systemctl --user restart pecenje-backend.service pecenje-tunnel.service
```

Провери:

```bash
systemctl --user status pecenje-backend.service pecenje-tunnel.service --no-pager
```

И двете треба да бидат `active (running)`.

## 3. Health Check

Пушти:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/check_production_stack.sh"
```

Провери:

- локален `health`
- јавен `health`
- database file постои
- services се `running`

## 4. Backup

Направи backup пред пуштање:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/backup_local_db.sh"
```

Провери дека се создал `.db.gz` фајл во:

```text
/home/zitomarketi/Desktop/Pecenje app/backups
```

## 5. Login Test

Тестирај:

- администратор login
- оператор login

И на web и на APK ако е потребно.

## 6. Functional Test

Провери барем по еден цел циклус:

1. активирај локација
2. креирај оператор
3. внеси план
4. оператор внеси `Пекара` или `Печењара`
5. оператор внеси `Пијара`
6. оператор внеси `Отпад`
7. админ отвори:
   - `Реално печење`
   - `Отпад`
   - `Извештаи`

## 7. Restart Test

Направи restart на services:

```bash
systemctl --user restart pecenje-backend.service pecenje-tunnel.service
```

Провери дека остануваат:

- активни локации
- корисници
- планови
- печки
- термини
- причини
- операторски внесови
- отпад

## 8. Reboot Test

Пред production пуштање направи и цел `reboot` на машината.

После reboot провери:

```bash
systemctl --user status pecenje-backend.service pecenje-tunnel.service --no-pager
```

И:

```bash
curl http://127.0.0.1:8081/health
curl https://app.superpetka.com/health
```

## 9. APK Check

Провери:

- APK download URL
- version-policy
- APK update/install

Тестирај:

```text
https://app.superpetka.com/downloads/app-debug.apk?v=102
```

И:

```text
https://app.superpetka.com/api/v1/version-policy
```

## 10. Before Go-Live

Потврди:

- нема build грешки
- има свеж backup
- services стартуваат по reboot
- login работи
- внесови се запишуваат
- извештаи се отвораат
- APK работи

Ако овие 10 точки се во ред, системот е спремен за production пуштање.
