# Native Android updater

Додаден е native Android updater за APK верзијата без Play Store.

## Како работи

Кога има `force update`:

- app ја проверува version policy
- на Android автоматски се повикува native updater
- updater го симнува новиот APK
- веднаш го отвора Android installer екранот

Фајлови:

- [frontend/android/app/src/main/java/mk/zitomarketi/pecenje/AppUpdaterPlugin.java](/home/zitomarketi/Desktop/Pecenje%20app/frontend/android/app/src/main/java/mk/zitomarketi/pecenje/AppUpdaterPlugin.java)
- [frontend/android/app/src/main/java/mk/zitomarketi/pecenje/MainActivity.java](/home/zitomarketi/Desktop/Pecenje%20app/frontend/android/app/src/main/java/mk/zitomarketi/pecenje/MainActivity.java)
- [frontend/src/lib/appUpdater.ts](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/lib/appUpdater.ts)
- [frontend/src/components/VersionGate.tsx](/home/zitomarketi/Desktop/Pecenje%20app/frontend/src/components/VersionGate.tsx)

## Ограничување

И понатаму Android бара корисникот да ја потврди инсталацијата.

Без Play Store или MDM не постои целосно silent self-update.

## Што добиваш

- автоматско препознавање на нова верзија
- автоматско симнување на APK
- автоматско отворање на install screen
- блокирање на старата верзија додека не се update-ира
