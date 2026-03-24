# GitHub Actions APK build

Локалниот Android build на оваа `arm64` машина удира во `AAPT2` toolchain проблем. Затоа APK може стабилно да се гради преку `GitHub Actions` на `ubuntu-latest`.

Workflow:

- [\.github/workflows/android-apk.yml](/home/zitomarketi/Desktop/Pecenje%20app/.github/workflows/android-apk.yml)

## Како се користи

1. push на репото на GitHub
2. отвори `Actions`
3. избери `android-apk`
4. `Run workflow`

Или workflow автоматски ќе се пушти при push на `main`/`master` ако има промени во `frontend/`.

## Што прави workflow-от

- checkout на кодот
- `Node 20`
- `Java 17`
- `npm install`
- `npm run mobile:sync`
- `./gradlew assembleDebug`
- upload на `app-debug.apk` како artifact

## Каде е APK

По успешен run:

- отвори го workflow run-от
- во `Artifacts` симни `pecenje-debug-apk`

Во artifact ќе биде:

```text
app-debug.apk
```

## Production напомена

Во workflow сега е поставено:

```text
VITE_API_BASE_URL=https://app.superpetka.com/api/v1
```

Значи GitHub Actions APK build-от е усогласен со тековната production адреса.
