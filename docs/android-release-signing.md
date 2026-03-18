# Android release signing

За production release APK е додаден workflow:

- [\.github/workflows/android-release.yml](/home/zitomarketi/Desktop/Pecenje%20app/.github/workflows/android-release.yml)

## Што треба во GitHub Secrets

Додади ги овие secrets во репото:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `VITE_API_BASE_URL`

## Како да го добиеш `ANDROID_KEYSTORE_BASE64`

Ако веќе имаш `.jks` или `.keystore` фајл:

```bash
base64 -w 0 release.keystore > release.keystore.base64
```

Потоа содржината од `release.keystore.base64` стави ја во GitHub secret `ANDROID_KEYSTORE_BASE64`.

## Ако немаш keystore

Генерирај нов:

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias pecenje-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Запомни ги:

- keystore password
- key alias
- key password

## Како работи workflow-от

- го декодира keystore-от на runner
- прави `npm install`
- прави `npm run mobile:sync`
- прави `./gradlew assembleRelease`
- го качува `app-release.apk` како artifact

## Како да го пуштиш

1. отвори `GitHub Actions`
2. избери `android-release`
3. `Run workflow`

## Резултат

По успешен run, во `Artifacts` ќе биде:

- `pecenje-release-apk`

Во него ќе биде:

```text
app-release.apk
```
