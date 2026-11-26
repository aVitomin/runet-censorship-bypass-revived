# Chrome Web Store listing copy

Use the [current channel record](../release-current.json) for published versions and the [submission checklist](STORE_PUBLICATION_CHECKLIST.md) for verification. The text below is prepared for the next listing edit.

## Published name

- **English:** Runet Censorship Bypass — Revived.
- **Russian:** Обход блокировок Рунета — Revived.
- Chrome reads the localized name from the package manifest. Both Revived names
  are part of version 1.0.1; keep them when updating the existing store item.
- Keep the existing extension ID and store URL. Canonical homepage, support and
  privacy destinations are in the
  [link audit](LINK_AUDIT_1_0.md#revived-preparation--2026-10-28).
  Check all three destinations when changing the listing.

## Short description

Independent Anticensority fork. Control website routing with Auto, Proxy and Direct rules.

Russian: Независимый форк Anticensority. Управление маршрутами сайтов: автоматически, через прокси или напрямую.

Both short descriptions come from the packaged `extDesc` locales. Chrome reads
them from the manifest. Check both locales in the candidate when changing the
[manifest description](https://developer.chrome.com/docs/extensions/reference/manifest/description).

## Long description — English

Runet Censorship Bypass — Revived is an independent Anticensority fork. Choose
how Chrome connects to sites: follow automatic rules, use a configured proxy,
or connect directly. In **Overview**, choose a routing source. Antizapret can use the provider’s proxies for matching sites. Proxy connections come from the routing provider, your own
proxy, or a separately running local service.

- Choose Auto, Proxy or Direct for a site, an exact host or a domain with subdomains.
- Use a built-in or custom PAC source, the optional Antifilter list, or Only my rules and connections.
- Check online sources for updates in the popup. It shows the source date and the last successful check separately.
- Open Website resources from the popup and start capture to review hosts requested by the current regular tab. Save selected hosts as browser-wide Proxy rules and apply them when ready. Results stay in the open tool.
- Configure your own proxies or connect to separately running Tor, Tor Browser or WARP.
- Save settings for review, then Apply them. Existing settings stay active until Apply.
- Transfer settings with import preview and create a separate sanitized support report.
- Check proxy connection status.
- Choose a light, dark or system appearance in Options; the popup uses the same theme.

Auto follows the selected source and rules; it can use a proxy. Explicit Direct
takes priority over Proxy. Proxy needs a suitable enabled connection. Updates
do not turn routing on or activate pending settings. The popup asks before
including other saved changes; unsaved Options edits are not included.

To get started, choose Antizapret if its service is available on your connection.
It can use its own proxies for sites its rules match when source proxies are
enabled. If the download is unavailable, import a trusted PAC under **Antizapret (local file)**.
Configure and enable your own proxy, then save and apply. This mode can route public hosts through that proxy even when they are outside the list. Explicit Direct rules still apply. To update the rules, import a fresh file.

Antifilter supplies an exact-host list and uses your enabled Proxy-rule
connections with your consent. Save changes, select Apply, then reload a site
covered by the source or your rule. Check its mode in the popup and confirm the
page loads. Old or unknown source dates show a warning without switching routing off.

Settings and configured proxy credentials are stored in your browser profile.
The extension has no developer telemetry or cloud synchronization. When a
request goes through a proxy, the proxy sees the destination and the traffic
its protocol exposes. If a matching proxy requests authentication for an
authorized route, Chrome can send the configured proxy credentials to that
proxy. An HTTPS proxy protects the connection to the proxy with TLS. For a
normally tunneled HTTPS site, the proxy sees the destination while the browser's
TLS connection to the site protects page content. Source servers receive
download requests and connection metadata such as IP address. Connection checks
can contact the destination and redirects. Settings exports omit credentials and
custom-source URLs and still include site rules and proxy addresses.

The active indicator confirms routing control, not connectivity or anonymity.
The extension does not guarantee bypass or encryption, and does not route other
applications. Some Chromium/PAC errors can lead to a direct connection.
SOCKS authentication depends on the browser.

[Guide](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/GUIDE.md) ·
[Help](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Privacy](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY.md)

## Полное описание — русский

«Обход блокировок Рунета — Revived» — независимый форк Anticensority.
Выбирайте, как Chrome открывает сайты: по автоматическим правилам, через
настроенный прокси или напрямую. Подключение обеспечивает провайдер
маршрутизации, ваш прокси или отдельно запущенная локальная служба.

В «Обзоре» выберите источник правил. Для подходящих сайтов Antizapret может использовать прокси источника.

- Режимы «Авто», «Прокси» и «Напрямую» для одного хоста или домена с поддоменами.
- Встроенный или свой PAC-источник, дополнительный список Antifilter либо режим «Только мои правила и подключения».
- Проверка обновлений сетевых источников из панели. Дата данных и время последней успешной проверки показаны отдельно.
- Откройте «Ресурсы сайта» в панели и запустите сбор. Просмотрите хосты текущей обычной вкладки и сохраните выбранные хосты как правила «Прокси» для всего браузера. Чтобы правила начали действовать, нажмите «Применить». Результаты сбора хранятся только в открытом инструменте.
- Собственные прокси и подключение к отдельно запущенным Tor, Tor Browser или WARP.
- Сохранение настроек отдельно от применения: прежние продолжают действовать до «Применить».
- Перенос настроек с предварительным просмотром и отдельный очищенный отчёт для поддержки.
- Проверка подключения через прокси.
- Светлая, тёмная или системная тема: настройки и панель используют один выбор.

«Авто» следует выбранному источнику и правилам, поэтому может использовать
прокси. Явное «Напрямую» приоритетнее «Прокси». Для «Прокси» нужно подходящее
включённое подключение. Обновление базы не включает маршрутизацию и не применяет
отложенные настройки. Панель спрашивает перед применением других сохранённых
изменений; несохранённые правки настроек в применение не входят.

Для первого запуска выберите Antizapret, если сервис доступен на вашем
подключении. Если использование прокси источника включено, сайты, подходящие
под его правила, могут открываться через прокси Antizapret. Если загрузка
недоступна, откройте «Антизапрет (локальный файл)» и импортируйте доверенный PAC.
Настройте и включите свой прокси, затем сохраните и примените изменения. Этот режим может направлять через ваш прокси публичные сайты вне списка.
Явные правила «Напрямую» сохраняют приоритет. Для обновления импортируйте свежий файл.

Antifilter
предоставляет список точных имён сайтов и с вашего разрешения использует
подключения для правил «Прокси». Сохраните изменения, нажмите «Применить»
и перезагрузите сайт из списка источника или своего правила. Проверьте режим
сайта в панели расширения и убедитесь, что страница загружается. Предупреждение
о старой или неизвестной дате базы не отключает маршрутизацию.

Настройки и учётные данные прокси хранятся в профиле браузера. Телеметрии
разработчика и облачной синхронизации нет. Прокси видит адрес назначения и
доступную его протоколу часть трафика. Если прокси, соответствующий применённому
маршруту, запрашивает аутентификацию, Chrome может передать ему настроенные
учётные данные. HTTPS-прокси защищает соединение с прокси с помощью TLS.
При обычном туннелировании HTTPS прокси видит адрес назначения, а соединение
браузера с сайтом по TLS защищает содержимое страницы. Серверы источников
получают запросы загрузки и данные подключения, например IP-адрес. Проверки
соединения могут обращаться к сайту и адресам переадресации. Файл настроек
содержит правила сайтов и адреса прокси. Учётные данные и URL своих источников
из него исключены.

Активный статус подтверждает управление маршрутами, а не доступность сайтов
или анонимность. Гарантий обхода и шифрования нет; другие приложения не
маршрутизируются. При некоторых ошибках Chromium/PAC возможен прямой выход.
Поддержка авторизации SOCKS зависит от браузера.

[Руководство](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/GUIDE.md) ·
[Помощь](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Приватность](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY.md)

## Permission justifications for the dashboard

Use the exact Chromium rows in the
[complete permission audit](PERMISSIONS_AND_PRIVACY.md#api-permissions--complete-manifest-inventory)
for `proxy`, `alarms`, `storage`, `notifications`, `webRequest`,
`webRequestAuthProvider` and `activeTab`. The host-permission table covers every
literal host grant, including `<all_urls>` and the overlapping built-in source
hosts. Firefox alone declares `dns` and `webRequestBlocking`.

Single-purpose field draft:

> Let users control browser website routing through automatic PAC rules,
> configured proxies or direct connections, with explicit application of saved
> routing settings.

Privacy-practices preparation:

- Declare **Authentication information** for configured proxy credentials and
  **Web history** for destination/request information handled for routing, even
  though there is no developer browsing-history upload. Also declare **User
  activity** for request lifecycle/error handling and connection checks: the
  current form includes network monitoring in this category. This is a mapping
  of the observed form to the package's network processing, not a claim of
  mouse/keyboard tracking. Review any other live dashboard category against the
  exact package and routed-data disclosures.
- Explain local storage, source retrieval, proxy transmission, and limited
  connection checks using the [privacy notice](PRIVACY.md). Do not certify
  “no user data handled” on the basis of local processing alone.
- Explain PAC download/browser evaluation explicitly in the remote-code field;
  prior approval applies to the reviewed package. Review the exact update and its proxy transport before certifying the submission.
- Complete Limited Use/no-sale/purpose-restriction certifications only after
  the publisher has reviewed the exact submission. This draft is not consent
  to certify on the publisher's behalf.
- Publish and verify the approved privacy notice on main before entering its
  public URL. Use the repository homepage and issue forms above; no legacy store
  listing or upstream publisher URL is a substitute.

The [privacy dashboard guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/)
and [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/)
require accurate permission/data disclosures, including locally handled data.
Checked on 2026-10-24; reconfirm the live form before submission. The FAQ
separately discusses user-specified protocol servers and same-computer native
programs; those distinctions do not establish approval of this exact package.

## Images and submission

Use screenshots captured from the candidate in both supported languages. See the
[Chrome Web Store listing guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/)
and [submission checklist](STORE_PUBLICATION_CHECKLIST.md). Historical images
and their provenance are in the [1.1.1 gallery](../assets/releases/1.1.1/README.md#english).
