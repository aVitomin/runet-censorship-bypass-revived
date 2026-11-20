# Первый запуск / First use

Черновик для локальной сборки. Для опубликованной версии см. [установку](../../user/INSTALLATION.md)
и [руководство](../../user/USER_GUIDE_1_0_2.md).

## Русский

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
     поддерживаемый файл Antizapret. Включите свой прокси и использование
     прокси источника. В этом режиме **Авто** направляет публичные домены через
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

В разделе **Источник правил** нажмите **Проверить источник**. Проверка покажет
HTTP-код сервера, сетевой сбой, тайм-аут или ошибку проверки данных. Она
использует текущее подключение и сохраняет действующие правила.
В Chromium проверяется первый адрес выбранного источника. Обновление базы
и применение настроек остаются отдельными действиями.
Для Antizapret в Firefox проверка показывает, готовы ли правила в расширении.
Чтобы обратиться к серверу источника, нажмите **Загрузить правила Antizapret**.

В Chromium можно выбрать локальный `.pac` для первичной проверки UTF-8
и наличия функции `FindProxyForURL`. Проверка не выполняет файл.
Для применения в Chromium отдайте доверенный файл с локального сервера,
доступного только на `127.0.0.1`, укажите его HTTP-адрес в собственном
источнике, сохраните и нажмите **Применить**.
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
[Уведомление о приватности версии 1.0.2](../../release/PRIVACY_1_0.md).

## English

Draft for the local build. For the published version, see [installation](../../user/INSTALLATION.md#english-summary)
and the [user guide](../../user/USER_GUIDE_1_0_2.md#english-summary).

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
     Antizapret file. Enable your own proxy and turn on source proxy use. In
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

Open **Routing source** and select **Check source**. The result shows the
server's HTTP status, a network failure, a timeout, or a validation error.
The check uses your current connection and leaves active routing in place.
Chromium checks the first address for the selected source. Updating routing
data and applying settings remain separate actions.
For Antizapret in Firefox, the check shows whether rules are ready in the
extension. Select **Download Antizapret rules** to contact the source server.

In Chromium, you can select a local `.pac` file to check its UTF-8 encoding
and whether it contains a `FindProxyForURL` function. The check does not run
the file. In Chromium, to apply a trusted file, serve it from a local
server bound to `127.0.0.1`, add that HTTP address as a custom source,
save, and select **Apply**. To run a trusted local PAC through Firefox itself,
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
[Version 1.0.2 privacy notice](../../release/PRIVACY_1_0.md).
