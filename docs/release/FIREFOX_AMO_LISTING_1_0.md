# Firefox Add-ons — listing copy 1.0.2

**Version 1.0.2 is public; verified on 2026-11-04:**
[Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/runet-censorship-bypass-mv3/),
Mozilla file 5202515. Localized names, descriptions, release notes and current
guide links are present. The text below is maintained listing copy, not proof
that every field matches the live card.

## Listing fields

Keep the existing AMO entry, Gecko ID and public URL. Both localized homepages
point to the renamed repository. The support field still points to its root;
use the issue-form URL below. Five screenshot captions are present in English;
add their Russian translations. See the [link audit](LINK_AUDIT_1_0.md).

- **Title:** Runet Censorship Bypass — Revived
- **Summary:** Choose Auto, Proxy or Direct for websites. Manage site rules and proxy connections, with separate Save and Apply controls.
- **Category:** Other. One category is sufficient; no security-benefit category
  or keyword is needed to describe routing control.
- **Keywords/tags:** no tags were selected: the live form's fixed choices did
  not include suitable routing/proxy terms. Do not substitute misleading tags.
- **Homepage:** [repository](https://github.com/aVitomin/runet-censorship-bypass-revived).
- **Support URL:** [issue forms](https://github.com/aVitomin/runet-censorship-bypass-revived/issues/new/choose).
- **Privacy URL:** the [1.0 privacy notice](PRIVACY_1_0.md) is published on main.
  The submitted notice uses its public project/support/security links.
- **Russian title:** Обход блокировок Рунета — Revived.
- **Russian summary:** Выбирайте «Авто», «Прокси» или «Напрямую» для сайтов.
  Настраивайте правила и подключения, сохраняйте изменения и применяйте их отдельно.
- **Screenshots:** [1.0.2 gallery](../assets/releases/1.0.2/README.md),
  covering Options and Website resources in English and Russian.

The summary is deliberately below Mozilla's 250-character limit. The
[AMO listing guidance](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/)
also recommends natural keywords and choosing only relevant categories.
Confirm the [Other category](https://addons.mozilla.org/en-US/firefox/extensions/category/other/)
in the live submission form.

## Description — English

Runet Censorship Bypass — Revived is an independent Anticensority fork.
Choose Auto, Proxy or Direct for websites in Firefox. The extension
controls browser routing and provides no VPN or proxy service.

- Set rules for one host or a domain and its subdomains.
- Use Anticensority data, the optional Antifilter list, or Only my rules and connections.
- Check source updates from the popup; source date and last successful check are shown separately.
- Website resources: manually review hosts from one non-private tab and save selected browser-wide Proxy rules, without applying them. Capture stays in the open tool page only.
- Configure your own proxies and separately running local services.
- Save settings, review changes, then Apply. Existing settings stay active until Apply.
- Preview imported settings, export settings for transfer, or create a separate sanitized support report.
- Refresh the selected source from the popup or automatically every 12 hours.
- Find site rules with search and switch settings sections without losing unsaved edits.
- Choose a light, dark or system appearance shared by Options and the popup.

Anticensority proxy routes need a suitable local service running separately.
Own proxies can be used for explicit Proxy rules. Auto follows the selected
source and rules; it can use a proxy. Explicit Direct takes priority over Proxy.
Updates do not turn routing on, apply pending settings or switch a manual source.
The popup asks before including other saved changes; unsaved Options edits are
not included. Enable private-window access before applying: Firefox requires it
for the browser-wide proxy setting.

Antifilter supplies an exact-host list, not proxy servers. It uses your selected
Proxy connections only after explicit consent. Old or unknown source dates show
a warning without switching routing off.

Settings and optional proxy credentials stay in your browser profile. There is
no developer telemetry or cloud synchronization. Routing-data downloads and
connection checks make network requests. Proxies receive destination information
and traffic visible to their protocol, plus matching credentials when needed.
Settings exports omit credentials but retain site rules and proxy addresses;
keep them private. Review support reports before sharing.

Firefox parses fixed Anticensority and Antifilter HTTPS downloads as static data without
executing downloaded PAC JavaScript. The data is validated but has no author's
cryptographic signature. Arbitrary/custom PAC sources are not supported here.
The extension does not guarantee bypass, connectivity, anonymity or encryption
and does not route other applications. SOCKS authentication depends on Firefox.

[Guide](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/USER_GUIDE_1_0_2.md) ·
[Help](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Privacy](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY_1_0.md)

## Полное описание — русский

«Обход блокировок Рунета — Revived» — независимый форк Anticensority.
Выбирайте «Авто», «Прокси» или «Напрямую» для сайтов в Firefox. Расширение
управляет маршрутами браузера; VPN или прокси-сервер в комплект не входят.

- Правила для одного хоста или домена с поддоменами.
- База Anticensority, дополнительный список Antifilter или режим «Только мои правила и подключения».
- Проверка обновлений базы из панели; дата данных и время последней проверки показаны отдельно.
- «Ресурсы сайта»: ручной просмотр доменов одной обычной вкладки и сохранение выбранных правил «Прокси» для всего браузера без применения. Сбор остаётся только в открытом инструменте.
- Собственные прокси и подключение к отдельно запущенным локальным службам.
- Сохранение, просмотр изменений и отдельное применение. До «Применить» действуют прежние настройки.
- Перенос настроек с предварительным просмотром и отдельный очищенный отчёт для поддержки.
- Обновление базы вручную или автоматически каждые 12 часов.
- Поиск правил и переключение разделов настроек с сохранением несохранённых правок.
- Светлая, тёмная или системная тема для настроек и панели расширения.

Прокси-маршрутам Anticensority нужна подходящая отдельно запущенная локальная
служба. Собственные прокси можно использовать для явных правил «Прокси».
«Авто» следует источнику и правилам, поэтому может использовать прокси.
Явное «Напрямую» приоритетнее «Прокси». Обновления не включают маршрутизацию,
не применяют отложенные настройки и не переключают ручной источник. Панель
спрашивает перед применением других сохранённых изменений; несохранённые правки
в применение не входят. Перед включением разрешите работу в приватных окнах:
это требование Firefox к общей настройке прокси.

Antifilter предоставляет список точных имён сайтов, без прокси-серверов. Он
использует выбранные вами подключения для правил «Прокси» с явного разрешения.
Предупреждение о старой или неизвестной дате базы не отключает маршрутизацию.

Настройки и учётные данные прокси хранятся в профиле браузера. Телеметрии
разработчика и облачной синхронизации нет. Загрузка базы и проверки подключений
выполняют сетевые запросы. Прокси получают адреса назначения, видимую им часть
трафика и при необходимости подходящие учётные данные. Экспорт исключает
учётные данные, но сохраняет правила сайтов и адреса прокси: храните его
приватно. Отчёт для поддержки нужно просмотреть перед отправкой.

Firefox обрабатывает данные с закреплённых HTTPS-источников Anticensority и Antifilter
без исполнения скачанного PAC-кода. Данные проходят проверки, но не имеют
криптографической подписи автора. Произвольные PAC-источники не поддерживаются.
Расширение не гарантирует обход, доступность, анонимность или шифрование
и не маршрутизирует другие приложения. Авторизация SOCKS зависит от Firefox.

[Руководство](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/user/USER_GUIDE_1_0_2.md) ·
[Помощь](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/SUPPORT.md) ·
[Приватность](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY_1_0.md)

## Maintainer attachments — not part of description

Use the version-specific 1.0.2 reviewer notes prepared for this submission,
the [permission/privacy audit](PERMISSIONS_AND_PRIVACY_1_0.md), and the five
[Firefox screenshots](../assets/releases/1.0.2/README.md) for each locale.
These are actual 1280×800 captures from the local candidate, with demonstration
settings and no personal data. Do not claim Android support or expand tested
desktop platforms from the manifest minimum alone.
