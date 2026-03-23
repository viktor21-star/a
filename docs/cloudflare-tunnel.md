# Cloudflare Tunnel

Ова е најлесниот начин апликацијата да работи надвор од локалната мрежа без `port-forward`.

## Локален backend

Прво локално мора да работи:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/start_local_stack.sh"
```

Провери:

```bash
curl http://127.0.0.1:8081/api/v1/version-policy
```

## Quick Tunnel

Ако сакаш прво само да тестираме:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/start_quick_tunnel.sh"
```

Ако `cloudflared` е инсталиран, ќе добиеш јавен URL како:

```text
https://example-name.trycloudflare.com
```

Тогаш API адресата за web/APK е:

```text
https://example-name.trycloudflare.com/api/v1
```

И APK download URL е:

```text
https://example-name.trycloudflare.com/downloads/app-debug.apk
```

## Во апликацијата

Ако app веќе работи, во `VersionGate`/API settings стави:

```text
https://example-name.trycloudflare.com/api/v1
```

## Ограничување

Quick Tunnel дава случаен URL при секое стартување. Тоа е добро за тест, но не е добро за стабилна production адреса.

## Правилно решение

За стабилна адреса треба:

1. Cloudflare account
2. домен што е на Cloudflare
3. `cloudflared tunnel login`
4. named tunnel што рутира на `http://127.0.0.1:8081`

Тогаш ќе добиеш фиксна адреса, пример:

```text
https://pecenje.tvojdomen.mk
```

И апликацијата ќе користи:

```text
https://pecenje.tvojdomen.mk/api/v1
```
