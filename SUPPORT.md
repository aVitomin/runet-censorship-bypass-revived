# Помощь и сообщения об ошибках

[Установка](docs/user/INSTALLATION.md) ·
[Руководство 1.0](docs/user/USER_GUIDE_1_0.md) ·
[Создать обращение](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new/choose)

## Сначала проверьте

| Что произошло | Что проверить |
| --- | --- |
| Сайт не открывается через прокси | Запущен ли прокси, Tor, Tor Browser или WARP; верны ли адрес и порт; выбрано ли подключение для правил **Прокси** |
| Изменения не действуют | В 1.0 сохраните настройки, затем нажмите **Применить**. Одного сохранения недостаточно |
| **Авто** работает иначе, чем ожидалось | Этот режим следует источнику и общим правилам. Он может направить сайт через прокси |
| Firefox просит разрешение | В **Дополнения и темы → Расширения** разрешите работу в приватных окнах, вернитесь в настройки, нажмите **Проверить снова**, затем **Применить** |
| Прокси контролирует другая программа | Проверьте другие расширения и политики браузера. Повторное сохранение правил не возвращает управление |
| База не изменилась после проверки | Новых данных могло не быть. В Firefox 1.0 при ручном источнике обновление остаётся подготовленным и не меняет выбранный режим |

Сначала посмотрите состояние в **Обзоре** и **Обслуживании**. Успешная проверка
одного подключения не подтверждает доступность всех сайтов. Удалять расширение
или сбрасывать настройки для первого обращения не нужно.

Для подписанного **Firefox 0.0.4.0** используйте [отдельное решение проблем](docs/user/TROUBLESHOOTING.md):
интерфейс отличается, а удалённое обновление базы в этой версии отключено.

<a id="slow-pages"></a>

## Сайты загружаются медленно

1. В настройках откройте **Импорт / Экспорт → Экспорт для поддержки**.
   Просмотрите отчёт перед отправкой. Укажите выбранный источник, включены ли
   прокси от источника и используются ли свои прокси, Tor, WARP или системный VPN.
   Для пользовательского источника достаточно слова «пользовательский», без URL.
2. Выберите две публичные страницы без личных параметров в адресе.
   Откройте **F12 → Сеть / Network** и отключите кеш на время замеров.
3. Сделайте по три перезагрузки каждой страницы в обычном режиме, затем в
   **Напрямую → Применить** для этого сайта, затем с выключенным через панель
   прокси расширения. Запишите **Load / Загрузка** внизу панели сети.

| Страница | Обычный режим | Напрямую | Прокси расширения выключен |
| --- | --- | --- | --- |
| Публичный адрес | … / … / … с | … / … / … с | … / … / … с |

Если страница не открылась или содержимое появляется заметно позже Load,
отметьте это. Интернет-подключение и остальные VPN/прокси-настройки не меняйте.
В выключенном режиме расширение не управляет маршрутом; системный VPN может
продолжать работать. Правило **Напрямую** относится к выбранному сайту,
а сторонние ресурсы могут идти другим маршрутом.

Не применяйте ради теста другие ожидающие изменения. Перед переключением
запишите исходные правила, а после проверки восстановите и примените их.
Полный экспорт настроек, HAR и NetLog для такого обращения не нужны.

## Сообщить об ошибке

Проверьте [существующие обращения](https://github.com/aVitomin/runet-censorship-bypass-revived/issues),
затем заполните [короткую форму](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new?template=bug_report.yml):

1. Браузер, его версия, ОС, версия расширения и способ установки.
2. Что делали, что ожидали и что получилось.
3. При необходимости — видимое состояние и снимок экрана без личных данных.

Добавьте **Импорт / Экспорт → Экспорт для поддержки**. Это отдельный очищенный
отчёт о среде и состоянии. В новых отчётах также отдельно указаны тип источника
и флаги сохранённых и действующих настроек. При выключенном или неподтверждённом
управлении действующие настройки не указаны. Эти флаги не подтверждают доступность
самого прокси или маршруты всех ресурсов страницы. Просмотрите файл перед отправкой.

Не прикладывайте **экспорт настроек**, профиль браузера, HAR/NetLog или сырые
логи: они могут раскрыть сайты, частные адреса, пароли, токены и cookies.
Экспорт настроек исключает пароли, но сохраняет правила сайтов и адреса прокси.

## Предложить улучшение или сообщить об уязвимости

[Для предложения](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new?template=feature_request.yml)
опишите задачу, которую хотите решить, и ожидаемое поведение.
Уязвимости отправляйте приватно по [политике безопасности](SECURITY.md).

## English

Check the extension status, your proxy/local service, and whether saved changes
were applied. Auto follows the selected source and rules; it can use a proxy.
Firefox requires private-window permission for its browser-wide proxy setting.

For slow pages, collect **Import / Export → Export for support** and note your
source, source-proxy setting and any other proxy/VPN. Do not include custom URLs.
With DevTools Network open and cache disabled, reload two public pages three
times each in normal mode, explicit **Direct → Apply**, and extension proxy OFF.
Record Load times or failures; note if visible content arrives later. Keep the
network and other VPN/proxy settings unchanged. Direct covers the selected site,
not every third-party resource; OFF does not disable a system VPN. Do not apply
unrelated pending changes. Restore the original rules after testing.

[Report a bug](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new?template=bug_report.yml)
with browser/OS/extension versions, installation method, steps and expected/actual
results. New support exports distinguish saved and verified applied source types
and routing flags; applied settings are unavailable when control is off or
unverified. Flags do not prove proxy reachability or every resource's route.
Inspect the report before sharing. Do not attach settings exports, profiles,
raw network logs or credentials.
Report vulnerabilities through the [private security channel](SECURITY.md).
