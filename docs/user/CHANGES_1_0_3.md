# Изменения в 1.0.3

**1.0.3 доступна в Firefox Add-ons и на GitHub:** Chromium ZIP и подписанный
Firefox XPI. Chrome Web Store пока предлагает 1.0.2; обновление отправлено. Способы установки указаны
в [инструкции](INSTALLATION.md). Основные настройки описаны в
[руководстве](USER_GUIDE_1_0_2.md).

## Что изменилось

- Меньше лишней фоновой работы в Chromium и повторных проверок состояния сайта
  в Firefox. Скорость конкретного сайта также зависит от сети и выбранного прокси.
- В Chromium появилась понятная подсказка, если вход в прокси временно заблокирован
  защитным механизмом расширения.
- Неиспользуемые копии баз и правил удаляются автоматически. Данные, необходимые
  для действующих и сохранённых настроек, активных запросов и восстановления,
  сохраняются.

Новых разрешений не требуется. Сохранение настроек по-прежнему не применяет их
автоматически; выключенное расширение не включается при обновлении базы.

## Если показано «Авторизация прокси недоступна»

Маршрутизация может оставаться активной, но новые запросы не смогут пройти
авторизацию на прокси. Полностью закройте браузер и запустите его заново.
Если браузер продолжает работать в фоне, завершите его через меню браузера.
Настройки сохранятся. Повторное применение настроек или перезапуск только
расширения не снимает эту защитную блокировку.

Не удаляйте настройки и не отправляйте пароли или полный экспорт конфигурации
для диагностики. Если проблема повторяется, укажите версии браузера и расширения,
общий режим подключения и очищенный код ошибки в [обращении](../../SUPPORT.md).

## English

**1.0.3 is available in Firefox Add-ons and on GitHub** as Chromium ZIP and
signed Firefox XPI. Chrome Web Store still offers 1.0.2; its update was submitted.
See [Installation](INSTALLATION.md).

- Less unnecessary background work in Chromium and fewer duplicate site-status
  checks in Firefox. Website speed also depends on the network and proxy.
- Chromium explains when a safety lock makes proxy sign-in unavailable.
- Unused dataset/PAC copies are collected automatically. Saved and active settings,
  active requests and recovery data remain protected.

No new permissions are required. Save remains separate from Apply; updating the
source does not turn an inactive extension on.

If **Proxy sign-in unavailable** appears, routing may still be active while new
requests cannot authenticate. Quit the browser completely, including background
operation, then reopen it. Settings are retained. Applying settings again or
restarting only the extension does not clear the safety lock.

Do not delete settings or share credentials/full configuration exports. If the
problem recurs, report browser/extension versions, the general connection mode
and a sanitized error code through [Support](../../SUPPORT.md).
