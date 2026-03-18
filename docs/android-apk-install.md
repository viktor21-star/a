# Android APK setup

Оваа апликација може да се спакува како Android APK преку `Capacitor`.

## Што е важно

- backend API мора да биде достапен од телефонот преку IP адреса на серверот
- во Android build не смее да остане `http://localhost:8081/api/v1`
- пред APK build постави `VITE_API_BASE_URL` кон реалната адреса на API

Пример:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
cp .env.android.example .env.production.local
```

Потоа ако треба смени:

```text
VITE_API_BASE_URL=http://192.168.11.40:8081/api/v1
```

## Инсталација на Android toolchain

Потребно е:

- `Android Studio`
- `Android SDK`
- `Java 17`

На Ubuntu:

```bash
sudo snap install android-studio --classic
sudo apt-get install -y openjdk-17-jdk
```

Потоа во Android Studio:

- `SDK Manager`
- инсталирај `Android SDK Platform`
- инсталирај `Android SDK Build-Tools`
- инсталирај `Android SDK Command-line Tools`

## Подготовка на проектот

Во `frontend`:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
/snap/bin/npm install
/snap/bin/npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
```

Ако `android/` веќе постои, наместо `add` користи:

```bash
npx cap sync android
```

## Build на APK

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend"
/snap/bin/npm run mobile:sync
/snap/bin/npm run mobile:open
```

Или директно преку helper script:

```bash
bash "/home/zitomarketi/Desktop/Pecenje app/scripts/build_android_apk.sh"
```

Скриптата автоматски:

- го вчитува `nvm` ако постои
- користи `Java 17`
- бара Android SDK во типични локации
- креира `frontend/android/local.properties`

Во Android Studio:

- `Build`
- `Build Bundle(s) / APK(s)`
- `Build APK(s)`

Debug APK најчесто ќе биде во:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Инсталација на телефон

1. префрли го `app-debug.apk` на телефонот
2. на телефонот отвори го APK фајлот
3. дозволи `Install unknown apps` ако Android побара
4. инсталирај ја апликацијата `Контрола на печење`

## Production препорака

За production:

- користи `HTTPS` backend
- потпиши release APK
- направи release build наместо debug
- отвори API пристап од мрежата каде што се телефоните

## Release build

Во Android Studio користи:

- `Build`
- `Generate Signed Bundle / APK`

Или преку Gradle:

```bash
cd "/home/zitomarketi/Desktop/Pecenje app/frontend/android"
./gradlew assembleRelease
```

Release APK ќе биде во:

```text
frontend/android/app/build/outputs/apk/release/app-release.apk
```
