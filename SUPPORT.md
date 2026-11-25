# Помощь и сообщения об ошибках

[Установка](docs/user/INSTALLATION.md) ·
[Руководство](docs/user/GUIDE.md) ·
[Создать обращение](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new/choose)

## Первый запуск

- **Chromium.** В настройках откройте **Источник правил** и выберите
  **Antizapret**, если сервис доступен на вашем подключении. При включённых
  прокси источника подходящие сайты могут открываться через прокси Antizapret.
- **Firefox.** Разрешите работу расширения в приватных окнах. Для
  прокси-маршрутов **Anticensority** запустите совместимую локальную службу,
  например Tor Browser или Tor.
- **В обоих браузерах.** Для **Antifilter** или собственного правила **Прокси**
  включите своё подключение. Для Antifilter разрешите использовать это
  подключение для сайтов из списка. В Firefox также загрузите список.
  Сохраните изменения и нажмите **Применить**. После включения откройте или
  перезагрузите нужный сайт, проверьте его режим в панели расширения и убедитесь,
  что страница загружается.

## Что получает прокси

Прокси видит адрес назначения и доступную его протоколу часть трафика.
При обычном туннелировании HTTPS соединение браузера с сайтом по TLS защищает
содержимое страницы. HTTPS-прокси также защищает соединение браузера с самим
прокси. Если подходящий прокси запрашивает аутентификацию для применённого
маршрута, браузер может передать ему настроенные учётные данные.

Загрузка правил обращается к серверу источника и передаёт обычные данные
подключения, включая видимый серверу IP-адрес. Проверка соединения обращается
к проверяемому сайту. Телеметрии разработчика и облачной синхронизации нет.
[Подробнее о приватности](docs/release/PRIVACY.md).

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

### First use

- **Chromium.** Open **Routing source** in Options and choose **Antizapret** if
  its service is available on your connection. With source proxies enabled,
  matching sites can use Antizapret proxies.
- **Firefox.** Allow the extension to run in private windows. For
  **Anticensority** proxy routes, run a compatible local service such as
  Tor Browser or Tor.
- **Both browsers.** Enable your own connection for **Antifilter** or for an
  explicit **Proxy** rule. For Antifilter, also allow use of that connection for
  listed sites. In Firefox, download the list as well. Save changes and select
  **Apply**. Once routing is on, open or reload the site, check its mode in the
  popup and confirm the page loads.

### What the proxy receives

The proxy sees the destination and the traffic its protocol exposes. For a
normally tunneled HTTPS site, TLS between the browser and the site protects
page content. An HTTPS proxy also protects the connection from the browser to
the proxy. If a matching proxy requests authentication for an applied route,
the browser can send the configured proxy credentials to that proxy.

Routing-data downloads contact the source server, which sees ordinary
connection metadata including the IP address visible to it. A connection check
contacts the site being checked. The extension has no developer telemetry or
cloud synchronization. [Privacy notice](docs/release/PRIVACY.md).

### Troubleshooting

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
