# Руководство пользователя

[Установка и загрузки](INSTALLATION.md) · [Помощь](../../SUPPORT.md) · [English](#english-summary)

## Первый запуск

### Chromium

1. Откройте настройки расширения и перейдите в **Обзор**. В мастере выберите
   источник, например Antizapret, если он доступен на вашем подключении. Нажмите
   **Сохранить источник и продолжить**. Дополнительные источники можно настроить
   в разделе **Источник правил**.
2. Проверьте требования выбранного источника.
   - **Antizapret** может использовать прокси этого провайдера для подходящих
     сайтов. Если прокси источника включены, свой сервер добавлять не нужно.
     Если выключены, включите их или настройте свой прокси и правила.
   - Для прокси-маршрутов **Anticensority** запустите совместимую локальную
     службу, например Tor. Со своим прокси используйте собственные правила.
   - **Antifilter** даёт список точных имён сайтов. Включите своё подключение
     для правил **Прокси** и разрешите использовать его для сайтов из списка.
     Применение загружает данные источника, если они ещё не готовы.
   - **Только мои правила и подключения** подходит для ручного выбора сайтов.
     Для правила **Прокси** нужно включённое подключение.
3. Сохраните изменения и нажмите **Применить**. Выбор источника сам по себе не
   включает маршрутизацию.

### Firefox

1. Откройте **Обзор**. На новой установке сначала разрешите работу расширения
   в приватных окнах. Это требуется для общей настройки прокси Firefox.
   Если Firefox закроет вкладку, снова откройте настройки.
2. Выберите источник.
   - **Antizapret** использует правила источника, DNS Firefox и ваш прокси.
     Нажмите **Загрузить правила Antizapret**. Если сервер не выдаёт файл с
     вашего подключения, нажмите **Импортировать PAC-файл** и выберите
     поддерживаемый файл Antizapret до 2 МиБ. Включите своё прокси-подключение
     и параметр **Использовать прокси провайдера**. В этом режиме **Авто** направляет публичные домены через
     ваш прокси, в том числе домены вне списка. Для исключения добавьте правило
     **Напрямую**.
   - Для прокси-маршрутов **Anticensority** запустите совместимую службу,
     например Tor, и подтвердите её запуск.
   - Для **Antifilter** загрузите список, включите своё подключение и разрешите
     использовать его для сайтов из списка.
   - Для собственных правил выберите **Только мои правила и подключения**.
3. Сохраните настройки и нажмите **Применить**. Загрузка и импорт Antizapret
   подготавливают правила. Только **Применить** переключает действующую
   маршрутизацию. Если файл не загрузился или не прошёл проверку, действующие
   правила сохраняются. Защищённый запрос завершается ошибкой при сбое
   необходимой проверки DNS или недоступности настроенного прокси.

### Antizapret через настройки браузера

Если хотите использовать исходный PAC Antizapret, отключите маршрутизацию
Revived и укажите `https://p.thenewone.lol:8443/proxy.pac` в системных настройках
прокси Chromium или в настройках соединения Firefox. Доступность зависит от IP,
с которого браузер получает файл. Если текущая сеть или VPN не даёт доступа,
проверьте подключение либо выберите другой источник в расширении. Правила
Revived применяются только при включении маршрутизации самого расширения.
[Официальная инструкция Antizapret](https://antizapret.prostovpn.org/).

### Проверка источника и локальный PAC

В разделе **Источник правил** нажмите **Проверить источник**. Для сетевого
источника при ошибке появится HTTP-код или причина сбоя. В Chromium проверяется
первый адрес. Действующие правила сохраняются. Обновление базы
и применение настроек остаются отдельными действиями.
Для Antizapret в Firefox проверка показывает, готовы ли правила в расширении.
Чтобы обратиться к серверу источника, нажмите **Загрузить правила Antizapret**.

В Chromium откройте **Источник правил**. В разделе **Антизапрет (локальный файл)**
найдите **Импортировать доверенный PAC-файл Антизапрета** и выберите файл
поддерживаемого формата до 2 МиБ. Успешный импорт сохраняет этот источник.
Включите свой прокси, сохраните изменения и нажмите **Применить**. В режиме
**Авто** публичные домены, включая домены вне списка, идут через настроенный
прокси. Для исключений задайте **Напрямую**. При ошибке выполнения PAC Chromium
может подключиться напрямую. Для обновления импортируйте свежий файл.

Для другого доверенного PAC отдельная проверка файла в Chromium проверяет
кодировку и наличие функции `FindProxyForURL`. Чтобы использовать его как
собственный источник, отдавайте файл с локального сервера на `127.0.0.1`,
укажите его HTTP-адрес, сохраните настройки и нажмите **Применить**.
Чтобы выполнить доверенный локальный PAC средствами Firefox, отключите
маршрутизацию Revived и укажите `file:///C:/путь/proxy.pac` в поле
**URL автоматической настройки прокси**. Для использования правил Antizapret в
самом Revived выберите **Импортировать PAC-файл** в настройках источника.
[Инструкция Firefox](https://support.mozilla.org/en-US/kb/connection-settings-firefox).

### Проверка и передача данных

Дождитесь, когда маршрутизация включится, и откройте или перезагрузите сайт,
который входит в список источника или совпадает с вашим правилом. Проверьте
режим сайта в панели расширения и убедитесь, что страница загружается.
В мастере можно отметить результат своей проверки.
В Firefox кнопка **Проверить соединение** в разделе **Обслуживание** проверяет
последний подходящий сайт с явным правилом **Прокси**.

Расширение выбирает маршрут. При использовании прокси браузер отправляет ему
адрес назначения и трафик, доступный протоколу. Подходящий прокси может
получить настроенные для него учётные данные в ответ на запрос аутентификации.
При обычном туннелировании HTTPS прокси видит адрес назначения, а TLS между
браузером и сайтом защищает содержимое страницы. TLS до HTTPS-прокси
защищает соединение браузера с самим прокси. [Документация Chromium о прокси](https://chromium.googlesource.com/chromium/src/+/main/net/docs/proxy.md) ·
[RFC 9110 о туннелях CONNECT](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.6).

Запросы за данными маршрутизации отдельно обращаются к серверам источника.
Сервер получает обычные данные подключения, например IP-адрес. Выполняемая
расширением проверка соединения обращается к проверяемому сайту. Телеметрии
разработчика и облачной синхронизации нет.
[Политика приватности](../release/PRIVACY.md).

### Выбрать маршрут сайта

Откройте обычную вкладку и нажмите значок расширения. Проверьте имя сайта.
**Авто** следует источнику и применимым правилам, **Через прокси** требует
настроенного подключения, **Напрямую** открывает сайт в обход прокси расширения.
Выберите область правила — один хост или домен с поддоменами. Примените правило
и перезагрузите сайт. Если панель сообщает о других сохранённых изменениях,
проверьте их перед применением.

### Обновить данные маршрутизации

Откройте подробности в панели или раздел **Обслуживание** в настройках.
Дата данных относится к самой базе, время успешной проверки — к обращению
за обновлением. Проверка источника, обновление данных и применение сохранённых
настроек — отдельные действия.

### Если сайт загружается не полностью

В панели обычной вкладки откройте **Ресурсы сайта**, начните сбор и
перезагрузите исходную вкладку. Воспроизведите проблему и остановите сбор.
Выберите только нужные домены. Сохранённые правила для выбранных хостов
действуют во всём браузере после применения. Для медленных страниц есть
[проверка в трёх режимах](../../SUPPORT.md#slow-pages).

### Перенести настройки или обратиться за помощью

В разделе **Импорт / Экспорт** экспортируйте настройки для переноса между
установками. Файл содержит правила сайтов и адреса прокси. При импорте
проверьте предварительный просмотр и отдельно примените сохранённый результат.
Для обращения в поддержку откройте **Импорт / Экспорт → Экспорт для поддержки**
и просмотрите скачанный отчёт. В нём указаны версия браузера и расширения,
тип источника и состояние маршрутизации. Правила сайтов, адреса прокси и
учётные данные в отчёт не входят. Прикладывайте именно этот файл. [Как сообщить о проблеме](../../SUPPORT.md)

## English summary

[Install or update](INSTALLATION.md#english-summary) · [Help](../../SUPPORT.md#english)

### Chromium

1. Open the extension's Options and go to **Overview**. In the guide, select
   a source such as Antizapret if it works on your connection. Select **Save
   source and continue**. Open **Routing source** for the full source settings.
2. Check what the selected source requires.
   - **Antizapret** can use its provider's proxies for matching sites. With
     source proxies enabled, you can start without adding your own server.
     If source proxies are off, turn them on or set up a proxy and site rules.
   - For **Anticensority** proxy routes, start a compatible local service such
     as Tor. Use your own site rules with your own proxy.
   - **Antifilter** provides an exact-host list. Enable a connection for
     **Proxy** rules and allow its use for listed sites. Apply downloads
     source data if it is not ready yet.
   - **Only my rules and connections** lets you control routes with your own
     site rules. A **Proxy** rule needs an enabled connection.
3. Save changes and select **Apply**. Routing stays off until you apply.

### Firefox

1. Open **Overview**. On a new installation, first allow the extension
   to run in private windows. Firefox requires this for browser-wide proxy
   settings. If Firefox closes Options, reopen it from the extension.
2. Choose a source.
   - **Antizapret** uses the source rules, Firefox DNS and your own proxy.
     Select **Download Antizapret rules**. If the server cannot serve the file
     on your connection, select **Import PAC file** and choose a supported
     Antizapret file up to 2 MiB. Enable your own proxy connection and turn on
     **Use provider proxies**. In
     this mode, **Auto** sends public domains through your proxy, including
     domains outside the list. Add a **Direct** rule for any exception.
   - For **Anticensority** proxy routes, start a compatible service such as Tor
     and confirm that it is running.
   - For **Antifilter**, download the list, enable your connection and allow it
     for listed sites.
   - To set your own rules, choose **Only my rules and connections**.
3. Save settings and select **Apply**. Downloading or importing Antizapret
   prepares the rules. **Apply** switches active routing. An unavailable or
   invalid file leaves active rules in place. A protected request fails if a
   required DNS check fails or the configured proxy is unavailable.

### Antizapret through browser settings

To use the original Antizapret PAC, turn off Revived routing and enter
`https://p.thenewone.lol:8443/proxy.pac` in Chromium's system proxy settings
or Firefox's connection settings. Availability depends on the IP address
the browser uses to fetch it. If your current network or VPN cannot reach
the PAC, check the connection or select another source in the extension.
Revived's site rules apply when routing in the extension is enabled.
[Official Antizapret setup](https://antizapret.prostovpn.org/).

### Source check and local PAC

Open **Routing source** and select **Check source**. For an online source,
a failed check shows the HTTP status or the reason it failed. Chromium checks
the first address. Active rules stay in place. Updating routing
data and applying settings remain separate actions.
For Antizapret in Firefox, the check shows whether rules are ready in the
extension. Select **Download Antizapret rules** to contact the source server.

In Chromium, open **Routing source**. Under **Antizapret (local file)**,
use **Import a trusted Antizapret PAC file** and choose a supported file up to
2 MiB. A successful import saves that source. Enable your own proxy, save any
changes and select **Apply**. In **Auto**, public hostnames, including those
outside the list, use your configured proxy. Use **Direct** for exceptions.
If Chromium cannot run the routing script, it can connect directly. To update
the rules, import a fresh file.

For other trusted PAC files, Chromium's file check verifies UTF-8 and the
presence of a `FindProxyForURL` function. To use one as a custom source, serve
it on `127.0.0.1`, enter the local HTTP URL, save and select **Apply**.
To run a trusted local PAC through Firefox itself,
turn off routing in Revived and enter `file:///C:/path/proxy.pac` under
**Automatic proxy configuration URL**. To use Antizapret rules inside Revived,
select **Import PAC file** in the source settings.
[Firefox connection settings](https://support.mozilla.org/en-US/kb/connection-settings-firefox).

### Verification and data flows

Wait for routing to turn on, then open or reload a site covered by the source
or one of your rules. Check its mode in the popup and confirm the page loads.
You can record the result of your check in the setup guide.
In Firefox, **Check connection** under **Maintenance** tests the last eligible
site with an explicit **Proxy** rule.

The extension selects the route. For proxied requests, the browser sends the
proxy the destination and the traffic exposed by the proxy protocol. A matching
proxy can receive the credentials configured for it in response to an
authentication challenge. For a normally tunneled HTTPS site, the proxy sees
the destination while TLS between the browser and the site protects page
content. TLS to an HTTPS proxy protects the browser's connection to the proxy.
[Chromium proxy documentation](https://chromium.googlesource.com/chromium/src/+/main/net/docs/proxy.md) ·
[RFC 9110 on CONNECT tunnels](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.6).

Routing-data downloads contact the source servers separately. The server
receives ordinary connection metadata such as IP address. An extension
connection check contacts the site being checked. The extension has no
developer telemetry or cloud synchronization.
[Privacy notice](../release/PRIVACY.md).

### Site rules, updates and support

Open the toolbar popup on a regular website. Check the hostname, then select
**Auto**, **Proxy** or **Direct** and the host or domain scope. Proxy needs
an enabled connection. Review any other saved changes before applying. Reload
the site to test the result.

Use the popup details or **Maintenance** for routing data. The source date
and the last successful check describe different events. To investigate a
partially loaded site, open **Website resources**, start capture, reload the
original tab and stop capture. Review hosts before saving browser-wide rules.

Use **Import / Export** to move settings. The transfer file contains site rules
and proxy addresses. For a bug report, open **Import / Export → Export for support**.
Review the downloaded report before attaching it. It includes browser and
extension versions, source type and routing status. It omits site rules, proxy
addresses and credentials. [Support](../../SUPPORT.md#english)
