# Chrome Web Store — prepared next description

**Version 1.0.2 submission copy. Store submission is not yet confirmed.**

Public version `1.0.1` was verified on 2026-10-30:
[Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph). The
[reviewer notes](CHROME_REVIEWER_NOTES_1_0.md) retain the PAC disclosure and
review requirements for future changes.
The shorter descriptions below are repository drafts for a future listing
edit; they have not replaced the submitted store copy or package metadata.

## Published name

- **English:** Runet Censorship Bypass — Revived.
- **Russian:** Обход блокировок Рунета — Revived.
- Chrome reads the localized name from the package manifest. Both Revived names
  are part of version 1.0.1; keep them when updating the existing store item.
- Keep the existing extension ID and store URL. Canonical homepage, support and
  privacy destinations are in the
  [link audit](LINK_AUDIT_1_0.md#revived-preparation--2026-10-28).
  Repository URLs have changed; saving the corresponding dashboard fields
  has not yet been verified. Earlier repository addresses redirect.

## Short description

Independent Anticensority fork. Control website routing with Auto, Proxy and Direct rules.

Russian: Независимый форк Anticensority. Управление маршрутами сайтов: автоматически, через прокси или напрямую.

This proposed copy is below the
[132-character manifest description limit](https://developer.chrome.com/docs/extensions/reference/manifest/description).
Chrome takes the short description from packaged/localized manifest metadata;
this document does not change it. The canonical package currently uses
`Bypass Runet censorship with configurable routing rules.` (English) and
`Обход блокировок Рунета с помощью настраиваемых правил маршрутизации.` (Russian).
Use those package-derived descriptions for this unchanged package; a future
description change requires a new validated artifact.

## Long description — English

Choose how Chrome opens websites: follow automatic rules, use a configured
proxy, or connect directly. Runet Censorship Bypass — Revived is an independent
Anticensority fork that controls browser routing; it provides no VPN or proxy service.

- Choose Auto, Proxy or Direct for a site, an exact host or a domain with subdomains.
- Use a built-in or custom PAC source, the optional Antifilter list, or Only my rules and connections.
- Check source updates from the popup; source date and last successful check are shown separately.
- Website resources: manually review hosts from one non-private tab and save selected browser-wide Proxy rules, without applying them. Capture stays in the open tool page only.
- Configure your own proxies or connect to separately running Tor, Tor Browser or WARP.
- Save settings for review, then Apply them. Existing settings stay active until Apply.
- Transfer settings with import preview and create a separate sanitized support report.
- Check routing-data updates and connection status.
- Choose a light, dark or system appearance in Options; the popup uses the same theme.

Auto follows the selected source and rules; it can use a proxy. Explicit Direct
takes priority over Proxy. Proxy needs a suitable enabled connection. Updates
do not turn routing on or activate pending settings. The popup asks before
including other saved changes; unsaved Options edits are not included.

Antifilter supplies an exact-host list, not proxy servers. It uses your selected
Proxy connections only after explicit consent. Old or unknown source dates show
a warning without switching routing off.

Settings and optional proxy credentials stay in your browser profile. There is
no developer telemetry or cloud synchronization. Sources, proxies and connection
checks make network requests; proxies receive destinations and traffic visible
to their protocol. Settings exports omit credentials and custom-source URLs,
but still contain site rules and proxy addresses: keep them private.

The active indicator confirms routing control, not connectivity or anonymity.
The extension does not guarantee bypass or encryption, and does not route other
applications. Some Chromium/PAC errors can lead to a direct connection.
SOCKS authentication depends on the browser.

[Guide](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/USER_GUIDE_1_0_2.md) ·
[Help](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Privacy](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY_1_0.md)

## Полное описание — русский

«Обход блокировок Рунета — Revived» — независимый форк Anticensority.
Выбирайте, как Chrome открывает сайты: по автоматическим правилам, через
настроенный прокси или напрямую. Расширение управляет маршрутами браузера;
VPN или прокси-сервер в комплект не входят.

- Режимы «Авто», «Прокси» и «Напрямую» для одного хоста или домена с поддоменами.
- Встроенный или свой PAC-источник, дополнительный список Antifilter либо режим «Только мои правила и подключения».
- Проверка обновлений базы из панели; дата данных и время последней проверки показаны отдельно.
- «Ресурсы сайта»: ручной просмотр доменов одной обычной вкладки и сохранение выбранных правил «Прокси» для всего браузера без применения. Сбор остаётся только в открытом инструменте.
- Собственные прокси и подключение к отдельно запущенным Tor, Tor Browser или WARP.
- Сохранение настроек отдельно от применения: прежние продолжают действовать до «Применить».
- Перенос настроек с предварительным просмотром и отдельный очищенный отчёт для поддержки.
- Обновление данных маршрутизации и проверка подключений.
- Светлая, тёмная или системная тема: настройки и панель используют один выбор.

«Авто» следует выбранному источнику и правилам, поэтому может использовать
прокси. Явное «Напрямую» приоритетнее «Прокси». Для «Прокси» нужно подходящее
включённое подключение. Обновление базы не включает маршрутизацию и не применяет
отложенные настройки. Панель спрашивает перед применением других сохранённых
изменений; несохранённые правки настроек в применение не входят.

Antifilter предоставляет список точных имён сайтов, без прокси-серверов. Он
использует выбранные вами подключения для правил «Прокси» с явного разрешения.
Предупреждение о старой или неизвестной дате базы не отключает маршрутизацию.

Настройки и учётные данные прокси хранятся в профиле браузера. Телеметрии
разработчика и облачной синхронизации нет. Источники, прокси и проверки подключений
выполняют сетевые запросы; прокси получают адреса назначения и видимую им часть
трафика. Экспорт исключает учётные данные и адреса своих источников, но сохраняет
правила сайтов и адреса прокси. Храните его приватно.

Активный статус подтверждает управление маршрутами, а не доступность сайтов
или анонимность. Гарантий обхода и шифрования нет; другие приложения не
маршрутизируются. При некоторых ошибках Chromium/PAC возможен прямой выход.
Поддержка авторизации SOCKS зависит от браузера.

[Руководство](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/USER_GUIDE_1_0_2.md) ·
[Помощь](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Приватность](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY_1_0.md)

## Permission justifications for the dashboard

Use the exact Chromium rows in the
[complete permission audit](PERMISSIONS_AND_PRIVACY_1_0.md#api-permissions--complete-manifest-inventory)
for `proxy`, `alarms`, `storage`, `notifications`, `webRequest`,
`webRequestAuthProvider` and `activeTab`. The host-permission table covers every
literal host grant, including `<all_urls>` and the overlapping built-in source
hosts. Do not add Firefox's `webRequestBlocking` justification to Chrome.

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
  connection checks using the [privacy notice](PRIVACY_1_0.md). Do not certify
  “no user data handled” on the basis of local processing alone.
- Explain PAC download/browser evaluation explicitly in the remote-code field;
  the reviewer notes identify the unresolved policy determination. Do not
  automatically choose “No” or assert an exemption/approval.
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

## Images and submission scope

Use the five [1.0.2 Chromium screenshots per locale](../assets/releases/1.0.2/README.md),
the existing 440x280 promotional PNG and the verified packaged icon.
Follow the [current listing guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/)
and [image requirements](https://developer.chrome.com/docs/webstore/images).
The existing public store link is recorded above. Version 1.0.1 uses the Revived
name. The 1.0.2 screenshots were captured from the exact local candidate.
Their presence in the repository does not establish a store submission or approval.
