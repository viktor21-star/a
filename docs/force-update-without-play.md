# Force update without Play Store

Имплементиран е сопствен `force update` модел без Play Store.

## Како работи

Backend:

- [backend/Pecenje.Api/Endpoints/VersionEndpoints.cs](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/Endpoints/VersionEndpoints.cs)

Frontend:

- [frontend/src/components/VersionGate.tsx](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/components/VersionGate.tsx)
- [frontend/src/lib/version.ts](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/lib/version.ts)

## Тековно однесување

- апликацијата ја проверува version policy пред да влезе корисникот
- ако backend врати `ForceUpdate = true` или `MinimumSupportedVersion` е повисока од тековната app верзија
- апликацијата се заклучува
- се прикажуваат:
  - тековна верзија
  - build
  - датум
  - најнова верзија
  - нов build
  - download URL

## Важно

Овој модел не прави silent install.

Android без Play Store и без MDM не дозволува апликацијата сама целосно да се надгради без корисничка интеракција.

Но може:

- да ја блокира старата верзија
- да го принуди корисникот да симне новиот APK
- да го води кон update линк

## За секој нов release

Треба да се ажурираат:

- `APP_VERSION`
- `APP_BUILD`
- `APP_BUILD_DATE`

во:

- [frontend/src/lib/version.ts](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/lib/version.ts)

и backend policy во:

- [backend/Pecenje.Api/Endpoints/VersionEndpoints.cs](/home/zitomarketi/Desktop/Pecenje%20app/backend/Pecenje.Api/Endpoints/VersionEndpoints.cs)

## Следна production фаза

Подобро решение за enterprise уреди е:

- `MDM/EMM` дистрибуција
- или приватен internal app store

Тогаш force update може да биде уште построг и пооперативен.
