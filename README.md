<p align="center">
  <img src="extension/src/assets/brand/icon-512.png" alt="Runet Censorship Bypass — Revived" width="88">
</p>

# Runet Censorship Bypass — Revived

Независимый форк [Anticensority](https://github.com/anticensority/runet-censorship-bypass).
**Chromium ZIP 1.0.3 доступен для ручной установки.**
В Chrome Web Store и Firefox Add-ons пока доступна **1.0.2**; обновление
магазинов до 1.0.3 ещё не отправлено. Подписанный Firefox XPI остаётся **1.0.2**.

Выбирайте, как браузер открывает сайты: по автоматическим правилам, через
настроенный прокси или напрямую. Расширение для Chromium и Firefox с интерфейсом
на русском и английском языках.

Расширение не предоставляет VPN или прокси-сервер. Оно использует выбранный
источник маршрутов, ваши прокси и отдельно запущенные Tor, Tor Browser или WARP.

[Установка](docs/user/INSTALLATION.md) ·
[Руководство 1.0.2](docs/user/USER_GUIDE_1_0_2.md) ·
[Помощь и сообщения об ошибках](SUPPORT.md) ·
[Новости](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/105) ·
[Поддержать проект](DONATE.md) ·
[English](#english)

## Скачать

| Браузер | Версия | Установка из магазина |
| --- | --- | --- |
| **Chrome, Brave и совместимые Chromium-браузеры** | **1.0.2** | [Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph) |
| **Firefox 140+** | **1.0.2** | [Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/runet-censorship-bypass-mv3/) |

Магазинные установки получают одобренные обновления через браузер.
Для ручной установки доступны **Chromium ZIP 1.0.3** и
**подписанный Mozilla Firefox XPI 1.0.2**.

Расчётная совместимость **1.0.1–1.0.3** — настольные **Chromium 108+** и
**Firefox 140+**, включая ESR, с необходимыми API.
Это оценка по используемым технологиям, а не проверка каждой версии и каждого
форка. [Требования и проверенные версии](docs/development/BROWSER_COMPATIBILITY.md).

**Ручная установка:** [Chromium ZIP 1.0.3](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.0.3/runet-censorship-bypass-mv3-1.0.3-34ab51b.zip) ·
[подписанный Firefox XPI 1.0.2](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.0.2/runet-censorship-bypass-firefox-1.0.2-signed.xpi) ·
[изменения и файлы v1.0.3](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.0.3).

В **1.0.3** уменьшена лишняя фоновая работа, добавлена очистка неиспользуемых
копий баз и подсказка при блокировке авторизации прокси.
[Что изменилось](docs/user/CHANGES_1_0_3.md) · [Основное руководство](docs/user/USER_GUIDE_1_0_2.md).

### Быстрый старт

1. Установите расширение из магазина своего браузера и закрепите его значок.
2. В Firefox разрешите работу в приватных окнах: это нужно для общей настройки прокси.
3. Откройте настройки, выберите источник и нужные подключения.
4. Нажмите **Сохранить настройки**, затем **Применить**.

[Подробная установка, обновление и проверка файлов](docs/user/INSTALLATION.md).
Архивы **Source code** предназначены для разработки.

## Как пользоваться версией 1.0

Откройте сайт и нажмите значок расширения:

| Режим | Что делает |
| --- | --- |
| **Авто** | Следует выбранному источнику и общим правилам |
| **Прокси** | Использует подходящее настроенное подключение |
| **Напрямую** | Обходит прокси расширения для этого сайта |

Правило можно задать для одного хоста или домена с поддоменами. **Напрямую**
имеет приоритет над **Прокси**. В режиме **Только мои правила и подключения**
автоматическая база не нужна.

**Сохранить** записывает настройки, **Применить** включает сохранённые изменения.
До применения продолжают действовать прежние настройки. Обновление базы
не включает выключенную маршрутизацию и не применяет отложенные правки.

[Подключения, источники, перенос настроек и обновления](docs/user/USER_GUIDE_1_0_2.md)

## Интерфейс

В обоих браузерах доступны светлая, тёмная и системная темы, русский и английский.
Ниже показан интерфейс Chromium и Firefox 1.0.2.

![Обзор Chromium 1.0.2, светлая тема](docs/assets/releases/1.0.2/chromium/ru/01-overview.png)

<details>
<summary>Подключения Chromium 1.0.2, тёмная тема</summary>

![Подключения Chromium 1.0.2, тёмная тема](docs/assets/releases/1.0.2/chromium/ru/03-connections.png)

</details>

<details>
<summary>Firefox 1.0.2: светлая и тёмная темы</summary>

![Настройки Firefox 1.0.2](docs/assets/releases/1.0.2/firefox/ru/01-overview.png)

![Подключения Firefox 1.0.2](docs/assets/releases/1.0.2/firefox/ru/03-connections.png)

</details>

## Помощь и приватность

Начните с [проверок и формы сообщения об ошибке](SUPPORT.md).
Состояние **Защита включена** означает управление маршрутизацией; оно не
гарантирует доступность сайтов, анонимность или шифрование. Используйте
доверенные источники и прокси.

[Приватность 1.0](docs/release/PRIVACY_1_0.md) ·
[Сообщить об уязвимости приватно](SECURITY.md) ·
[Вся документация](docs/README.md)

<details>
<summary>Проверить скачанные файлы</summary>

**Chromium 1.0.3** — `runet-censorship-bypass-mv3-1.0.3-34ab51b.zip`

SHA-256: `ef7ecd3f90295857aea08abe66bca9ad1a4e6d6e75a9861c15fbe0986553419e`

[Контрольная сумма ZIP](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.0.3/runet-censorship-bypass-mv3-1.0.3-34ab51b.zip.sha256.txt)

**Firefox 1.0.2** — `runet-censorship-bypass-firefox-1.0.2-signed.xpi`

SHA-256: `35aec76967e2b26198139766c507d828cd95572b86679d5b0e14ff4cdc0ee203`

[Контрольная сумма XPI](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/download/v1.0.2/runet-censorship-bypass-firefox-1.0.2-signed.sha256.txt) ·
[Выпуск 1.0.2](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.0.2)

</details>

## English

**Runet Censorship Bypass — Revived** is an independent Anticensority fork.
**Version 1.0.2 is available in Chrome Web Store and Firefox Add-ons.**
**Chromium ZIP 1.0.3** is available for manual installation; the signed Firefox
XPI remains **1.0.2**. Store submissions for 1.0.3 are pending.
[Changes in 1.0.3](docs/user/CHANGES_1_0_3.md#english).

Choose **Auto**, **Proxy**, or **Direct** for websites in Chromium and Firefox.
The extension controls browser routing and provides no VPN or proxy service.
Save records settings; Apply activates them.

Install from [Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph) or
[Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/runet-censorship-bypass-mv3/).
Expected 1.0.1–1.0.3 minimums are desktop **Chromium 108+** and **Firefox 140+**, including
ESR on a compatible base. See [installation](docs/user/INSTALLATION.md#english-summary),
[the 1.0.2 guide](docs/user/USER_GUIDE_1_0_2.md#english-summary), and [help](SUPPORT.md#english).

Support this independent fork: [donations](DONATE.md#english).

<details>
<summary>Разработчикам и пользователям старых версий</summary>

[Разработка](docs/development/DEVELOPMENT.md) ·
[Архитектура](docs/development/ARCHITECTURE.md) ·
[Тестирование](docs/development/TESTING.md) ·
[Процесс выпуска](docs/development/RELEASE_PROCESS.md) ·
[Участие в проекте](CONTRIBUTING.md)

Firefox 0.0.4.0: [руководство](docs/user/USER_GUIDE.md),
[решение проблем](docs/user/TROUBLESHOOTING.md),
[приватность](docs/user/PRIVACY_AND_SECURITY.md).
[Исторический README](docs/legacy/UPSTREAM_README.md).

</details>

Проект основан на [Anticensority](https://github.com/anticensority/runet-censorship-bypass)
с сохранением авторства и истории. Лицензия: [GNU GPL v3](LICENSE).
