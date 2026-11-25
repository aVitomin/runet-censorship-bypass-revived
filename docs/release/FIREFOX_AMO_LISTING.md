# Firefox Add-ons listing copy

Use the [current channel record](../release-current.json) for published versions and the [submission checklist](STORE_PUBLICATION_CHECKLIST.md) for verification. The text below is prepared for the next listing edit.

## Listing fields

Keep the existing AMO entry, Gecko ID and public URL. Verify both localized descriptions, the shared gallery and its translated captions in the dashboard.

- **Title:** Runet Censorship Bypass — Revived
- **Summary:** Choose Auto, Proxy or Direct for websites. Manage site rules and proxy connections, with separate Save and Apply controls.
- **Category:** Other. One category is sufficient; no security-benefit category
  or keyword is needed to describe routing control.
- **Keywords/tags:** no tags were selected: the live form's fixed choices did
  not include suitable routing/proxy terms. Do not substitute misleading tags.
- **Homepage:** [repository](https://github.com/aVitomin/runet-censorship-bypass-revived).
- **Support URL:** [issue forms](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new/choose).
- **Hosted privacy policy:** use the full approved [privacy notice](PRIVACY.md) for AMO’s policy text. Verify the rendered policy page separately from the privacy link in the description.
- **Russian title:** Обход блокировок Рунета — Revived.
- **Russian summary:** Выбирайте «Авто», «Прокси» или «Напрямую» для сайтов.
  Настраивайте правила и подключения, сохраняйте изменения и применяйте их отдельно.
- **Screenshots:** use a single gallery captured from the candidate and enter Russian and English captions. The [1.0.2 gallery](../assets/releases/1.0.2/README.md) is retained with its provenance.

The summary is deliberately below Mozilla's 250-character limit. The
[AMO listing guidance](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/)
also recommends natural keywords and choosing only relevant categories.
Confirm the [Other category](https://addons.mozilla.org/en-US/firefox/extensions/category/other/)
in the live submission form.

## Description — English

Runet Censorship Bypass — Revived is an independent Anticensority fork.
Choose Auto, Proxy or Direct for websites in Firefox. Open **Overview** to select
a source. For Antizapret, open **Routing source** and select
**Download Antizapret rules** or **Import PAC file**. **Check source** checks the local copy. Configure
your own proxy, save and apply. In Auto, public domains can use this proxy even
outside the list. Add a Direct rule for exceptions.

- Set rules for one host or a domain and its subdomains.
- Choose Anticensority, Antifilter, Antizapret or manual site rules.
- For Anticensority or Antifilter, check for updates in the popup or let Firefox check the selected source every 12 hours. The source date and last successful check are shown separately.
- Website resources: manually review hosts from one non-private tab and save selected browser-wide Proxy rules, without applying them. Capture stays in the open tool page only.
- Configure your own proxies and separately running local services.
- Save settings, review changes, then Apply. Existing settings stay active until Apply.
- Preview imported settings, export settings for transfer, or create a separate sanitized support report.
- Find site rules with search and switch settings sections without losing unsaved edits.
- Choose a light, dark or system appearance shared by Options and the popup.

To get started with Anticensority, run a compatible local service such as
Tor Browser or Tor. Anticensority proxy routes use that service, and you can
configure your own proxies for explicit Proxy rules. Auto follows the selected
source and rules; it can use a proxy. Explicit Direct takes priority over Proxy.
Updates do not turn routing on, apply pending settings or switch a manual source.
The popup asks before including other saved changes; unsaved Options edits are
not included. Enable private-window access before applying: Firefox requires it
for the browser-wide proxy setting. Save changes, select Apply, then reload a
site covered by the source or your rule. Check its mode in the popup and confirm
that the page loads.

Antifilter supplies an exact-host list, not proxy servers. It uses your selected
Proxy connections only after explicit consent. Old or unknown source dates show
a warning without switching routing off.

Settings and configured proxy credentials are stored in your browser profile.
The extension has no developer telemetry or cloud synchronization. When a
request goes through a proxy, the proxy sees the destination and the traffic
its protocol exposes. If a matching proxy requests authentication for an
authorized route, Firefox can send the configured proxy credentials to that
proxy. An HTTPS proxy protects the connection to the proxy with TLS. For a
normally tunneled HTTPS site, the proxy sees the destination while the browser's
TLS connection to the site protects page content. Source servers receive
download requests and connection metadata such as IP address. A connection
check contacts the site being checked. Settings exports omit credentials and
still include site rules and proxy addresses. Review support reports before sharing.

Firefox reads Anticensority, Antifilter and supported Antizapret rules as data
without executing downloaded PAC JavaScript. For Antizapret, the configured
DNS resolver can receive a hostname when Firefox needs its IP address. The data is validated but has no author's
cryptographic signature. Arbitrary/custom PAC sources are not supported here.
The extension does not guarantee bypass, connectivity, anonymity or encryption
and does not route other applications. SOCKS authentication depends on Firefox.

[Guide](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/GUIDE.md) ·
[Help](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Privacy](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY.md)

## Полное описание — русский

«Обход блокировок Рунета — Revived» — независимый форк Anticensority.
Выбирайте «Авто», «Прокси» или «Напрямую» для сайтов в Firefox. Откройте
«Обзор» и выберите источник. Для Antizapret в разделе «Источник правил»
нажмите «Загрузить правила Antizapret» или «Импортировать PAC-файл».
Кнопка «Проверить источник» проверяет локальную копию. Настройте свой прокси,
сохраните и примените настройки. В режиме «Авто» через него могут идти
и публичные домены вне списка. Для исключений добавьте правило «Напрямую».

- Правила для одного хоста или домена с поддоменами.
- На выбор — Anticensority, Antifilter, Antizapret или собственные правила без автоматического списка.
- Если выбран Anticensority или Antifilter, Firefox проверяет обновления каждые 12 часов. Проверку также можно запустить из панели. Дата данных и время последней успешной проверки показаны отдельно.
- «Ресурсы сайта»: ручной просмотр доменов одной обычной вкладки и сохранение выбранных правил «Прокси» для всего браузера без применения. Сбор остаётся только в открытом инструменте.
- Собственные прокси и подключение к отдельно запущенным локальным службам.
- Сохранение, просмотр изменений и отдельное применение. До «Применить» действуют прежние настройки.
- Перенос настроек с предварительным просмотром и отдельный очищенный отчёт для поддержки.
- Поиск правил и переключение разделов настроек с сохранением несохранённых правок.
- Светлая, тёмная или системная тема для настроек и панели расширения.

Чтобы начать с Anticensority, запустите совместимую локальную службу, например
Tor Browser или Tor. Прокси-маршруты Anticensority используют эту службу.
Для явных правил «Прокси» можно настроить собственный прокси.
«Авто» следует источнику и правилам, поэтому может использовать прокси.
Явное «Напрямую» приоритетнее «Прокси». Обновления не включают маршрутизацию,
не применяют отложенные настройки и не переключают ручной источник. Панель
спрашивает перед применением других сохранённых изменений; несохранённые правки
в применение не входят. Перед включением разрешите работу в приватных окнах:
это требование Firefox к общей настройке прокси. Сохраните изменения, нажмите
«Применить» и перезагрузите сайт из списка источника или своего правила.
Проверьте режим сайта в панели расширения и убедитесь, что страница загружается.

Antifilter предоставляет список точных имён сайтов, без прокси-серверов. Он
использует выбранные вами подключения для правил «Прокси» с явного разрешения.
Предупреждение о старой или неизвестной дате базы не отключает маршрутизацию.

Настройки и учётные данные прокси хранятся в профиле браузера. Телеметрии
разработчика и облачной синхронизации нет. Прокси видит адрес назначения и
доступную его протоколу часть трафика. Если прокси, соответствующий применённому
маршруту, запрашивает аутентификацию, Firefox может передать ему настроенные
учётные данные. HTTPS-прокси защищает соединение с прокси с помощью TLS.
При обычном туннелировании HTTPS прокси видит адрес назначения, а соединение
браузера с сайтом по TLS защищает содержимое страницы. Серверы источников
получают запросы загрузки и данные подключения, например IP-адрес. Проверка
соединения обращается к проверяемому сайту. Файл настроек содержит правила
сайтов и адреса прокси. Учётные данные из него исключены. Отчёт для поддержки
нужно просмотреть перед отправкой.

Firefox читает правила Anticensority, Antifilter и поддерживаемые файлы Antizapret
как данные без исполнения скачанного PAC-кода. Когда для правила Antizapret нужен
IP-адрес, Firefox может передать имя сайта настроенному DNS-резолверу. Данные проходят проверки, но не имеют
криптографической подписи автора. Произвольные PAC-источники не поддерживаются.
Расширение не гарантирует обход, доступность, анонимность или шифрование
и не маршрутизирует другие приложения. Авторизация SOCKS зависит от Firefox.

[Руководство](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/GUIDE.md) ·
[Помощь](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Приватность](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY.md)

## Reviewer materials

Use the [Firefox reviewer instructions](../development/FIREFOX_AMO_REVIEW.md),
[permissions inventory](PERMISSIONS_AND_PRIVACY.md) and [submission checklist](STORE_PUBLICATION_CHECKLIST.md).
Match the reviewer source archive and screenshots to the candidate being submitted.
