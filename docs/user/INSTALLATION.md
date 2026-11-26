# Установка, обновление и удаление

Firefox Add-ons предлагает **1.1.1**, а Chrome Web Store — **1.1.0**.
Для ручной установки доступны **Chromium ZIP 1.1.1** и **подписанный Firefox XPI 1.1.1**.
Версии в магазинах проверены 26 ноября 2026 года.

## Установить из магазина

| Браузер | Версия | Где установить |
| --- | --- | --- |
| Chrome, Brave и совместимые Chromium-браузеры | **1.1.0** | [Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph) |
| Firefox **140+** | **1.1.1** | [Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/runet-censorship-bypass-mv3/) |

1. Откройте магазин в нужном браузере, нажмите кнопку установки и подтвердите разрешения.
2. Закрепите значок расширения на панели.
3. В Firefox откройте **Дополнения и темы → Расширения → Обход блокировок Рунета — Revived**
   и разрешите работу в приватных окнах. Это требуется для общей настройки
   прокси, в том числе в обычных окнах.
4. Настройте расширение по разделу [«Первый запуск»](#первый-запуск).

В Chrome для обычных вкладок можно оставить настройки доступа по умолчанию.
Чтобы открывать панель расширения в окне инкогнито, включите **Разрешить
использование в режиме инкогнито** в сведениях о расширении. Доступ к
файловым URL — отдельная настройка. Для сайтов и выбора PAC-файла через
кнопку импорта она не требуется.

Магазин — основной способ установки и получения следующих одобренных обновлений.
Если установка ограничена политикой организации, обратитесь к администратору.

## Требования

Минимальные версии по манифестам:
**Chromium 108+** и **Firefox 140+**, включая ESR на подходящей базе.
Ожидается работа в совместимых настольных браузерах с Manifest V3 и API прокси.
Версия движка Chromium важнее собственного номера Brave, Opera или другого
форка. Android, iOS, WebView и браузеры без нужных API в эту оценку не входят.
Каждая версия и каждый форк отдельно не проверялись;
[основания и фактические проверки](../development/BROWSER_COMPATIBILITY.md) указаны отдельно.

Проверенные браузеры и границы QA: [технические сведения о 1.0.3](../development/releases/1.0.3.md),
[1.0.2](../development/releases/1.0.2.md) и [1.0.1](../development/releases/1.0.1.md).

## Ручная установка Chromium: ZIP

1. Скачайте [готовый ZIP 1.1.1](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.1.1/runet-censorship-bypass-chromium-1.1.1-34f3f65.zip).
   SHA-256 указан ниже и в [описании релиза](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.1.1).
2. Проверьте SHA-256 и полностью распакуйте ZIP в постоянную папку.
3. Откройте `chrome://extensions`, `brave://extensions` или `edge://extensions`.
4. Включите **Режим разработчика → Загрузить распакованное расширение**.
5. Выберите папку, в корне которой находится `manifest.json`, и закрепите значок.

Не перемещайте и не удаляйте эту папку: браузер продолжает читать её файлы.
Архивы **Source code** содержат исходники, а не готовое расширение.

В разделе загрузок GitHub выбирайте файл с подписью **Chromium — ZIP**.

SHA-256 ZIP:

```text
9fa70108c0764452e74a81f442bda85ef1ce488ffa169a10a67ad2d778726317
```

Пример проверки в Windows:

```powershell
Get-FileHash .\runet-censorship-bypass-chromium-1.1.1-34f3f65.zip -Algorithm SHA256
```

Если сумма отличается, не устанавливайте файл.

## Ручная установка Firefox: подписанный XPI

1. Скачайте [подписанный Firefox XPI 1.1.1](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.1.1/runet-censorship-bypass-firefox-1.1.1-signed.xpi).
   SHA-256 указан ниже и в [описании релиза](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.1.1).
2. Проверьте SHA-256. В Firefox откройте **Дополнения и темы → шестерёнка →
   Установить дополнение из файла**, выберите XPI и подтвердите установку.
3. Разрешите расширению работу в приватных окнах и закрепите значок.

Это тот же файл, который распространяет Mozilla; зеркало GitHub не меняет его содержимое.

SHA-256 XPI:

```text
0cc8ca9ed5aac43f34e77e6dcb6394e700e4e74d72fe54a9bafcbf573cc8d0d5
```

В Windows выполните `Get-FileHash` с именем XPI и сравните результат с суммой выше. Для обычной установки используйте подписанный пакет.

## Первый запуск

1. Откройте настройки расширения и перейдите в **Обзор**. При первой установке
   мастер поможет выбрать источник. Пока вы настраиваете расширение, маршрутизация выключена.
2. Если выбрали **Antizapret**, дальнейшие действия зависят от браузера.
   - **Chromium.** Онлайн-источник может использовать прокси провайдера. Для файла
     откройте **Источник правил → Антизапрет (локальный файл) → Импортировать доверенный PAC-файл Антизапрета**.
     Выберите сохранённый PAC и включите свой прокси.
   - **Firefox.** В разделе **Источник правил** выберите **Antizapret** и нажмите
     **Загрузить правила Antizapret**. Если загрузка недоступна, выберите
     **Импортировать PAC-файл**. Для обоих вариантов включите свой прокси и
     параметр **Использовать прокси провайдера**.
3. Сохраните настройки, затем нажмите **Применить**. Откройте или перезагрузите
   подходящий под правило сайт. Нажмите значок расширения и проверьте имя
   сайта, выбранный режим и состояние маршрутизации.

Режим **Только мои правила и подключения** не требует автоматической базы.
Для режима **Прокси** нужно подходящее настроенное подключение.
Расширение не предоставляет VPN или прокси-сервер и не запускает локальные службы.

[Руководство пользователя](GUIDE.md).

## Обновить расширение

### Установка из магазина

Браузер получает новые одобренные версии через обновление расширений, если
автообновления разрешены. После обновления проверьте версию, настройки и состояние
маршрутизации. Подписанный Firefox XPI с тем же идентификатором также можно обновить вручную.

### Chromium: сохранить ту же установку

Для расширения, загруженного из распакованного ZIP:

1. Выключите маршрутизацию перед заменой файлов.
2. Скачайте новый ZIP из [Releases](https://github.com/aVitomin/runet-censorship-bypass-revived/releases)
   и проверьте SHA-256.
3. Полностью замените файлы в **той же постоянной папке**. Не смешивайте разные версии.
4. На странице расширений нажмите **Перезагрузить** у существующей карточки.
5. Проверьте настройки и явно примените их.

ZIP не обновляется через магазин. Другая папка или переход с распакованной
Chromium-версии на магазинную могут создать отдельную установку с собственным
хранилищем. Для переноса используйте экспорт и импорт настроек; пароли и
адрес пользовательского источника нужно ввести заново. Выключите прежнюю
установку перед применением новой, чтобы они не конкурировали за управление прокси.
Не рассчитывайте на автоматический перенос данных между установками.

## Обновить данные или удалить расширение

Обновление данных маршрутизации из панели расширения или **Обслуживания**
не устанавливает новую версию расширения. Оно сохраняет применённые настройки
и не включает выключенную маршрутизацию:
[подробнее](GUIDE.md#обновить-данные-маршрутизации).

Для удаления сначала выключите маршрутизацию, затем удалите расширение на
странице расширений браузера. После удаления распакованной Chromium-установки
можно удалить её постоянную папку.

Для старого **Firefox 0.0.4.0** сохранено [отдельное руководство](USER_GUIDE.md).
В нём другой интерфейс и отключено удалённое обновление базы.

## English summary

Install **Chromium 1.1.0** from [Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph) or **Firefox 1.1.1** from
[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/runet-censorship-bypass-mv3/). Firefox requires **140+** and private-window
permission for browser-wide proxy control. Store installations receive approved
updates through the browser when automatic updates are enabled.

In Chrome, default access works for ordinary tabs. Turn on **Allow in Incognito**
to open the extension panel in a private window. File URL access is separate.
You can leave it off when browsing websites or choosing a PAC file through the importer.

The [manual Chromium ZIP 1.1.1](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.1.1/runet-censorship-bypass-chromium-1.1.1-34f3f65.zip) and [Mozilla-signed Firefox XPI 1.1.1](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.1.1/runet-censorship-bypass-firefox-1.1.1-signed.xpi) are available on GitHub. The manifests target desktop **Chromium 108+** and **Firefox 140+**,
including ESR releases on a compatible base. These are API-based compatibility
estimates, not test results for every version or fork. Required MV3 and proxy
extension APIs must be available; mobile browsers and WebView are outside this scope.

For manual installation, verify the ZIP/XPI checksum. Load the extracted Chromium
folder in Developer mode, or install the Mozilla-signed XPI through Firefox's
Add-ons Manager. An unpacked Chromium installation needs manual file updates.
Switching it to a store installation may require settings transfer; exported
settings omit credentials and custom-source URLs. Disable the old installation
before applying the new one.

On first install, open **Overview**. If you choose **Antizapret**:

- **Chromium.** The online source can use the provider’s proxies. To use a saved
  PAC, open **Routing source → Antizapret (local file) → Import a trusted Antizapret PAC file**.
  Choose the file and enable your own proxy.
- **Firefox.** Under **Routing source**, choose **Antizapret** and select
  **Download Antizapret rules**. If the download fails, select **Import PAC file**.
  For either option, enable your own proxy and turn on **Use provider proxies**.

Save your settings and select **Apply**. Reload a site covered by a rule and
check its hostname and mode in the popup. See the [user guide](GUIDE.md#english-summary).
