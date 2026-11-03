'use strict';

(function(root) {
  function mount({browserApi, adapter, translate: t, document: doc = document,
    window: win = window}) {
    const Core = root.rucbSiteResources;
    const container = doc.getElementById('resources-root');
    const tabId = /^#[0-9]+$/u.test(win.location.hash) ? Number(win.location.hash.slice(1)) : -1;
    let host = '';
    let capture = null;
    let snapshot = null;
    let busy = false;
    let listening = false;
    let lastPhase = '';
    const selection = new Set();
    const append = (parent, tag, text = '', className = '') => {
      const node = doc.createElement(tag);
      node.textContent = text;
      if (className) node.className = className;
      parent.appendChild(node);
      return node;
    };
    container.replaceChildren();
    const title = append(container, 'h1', t('resourcesTitle'));
    const target = append(container, 'p', '', 'resource-target');
    const intro = append(container, 'p', t('resourcesIntro'));
    const privacySummary = append(container, 'p', t('resourcesPrivacySummary'), 'resource-muted');
    const privacyDetails = append(container, 'details', '', 'resource-privacy');
    const privacyHeading = append(privacyDetails, 'summary', t('resourcesDetails'));
    const privacy = append(privacyDetails, 'p', t('resourcesPrivacy'), 'resource-muted');
    const controls = append(container, 'div', '', 'resource-actions');
    const button = (text, action) => {
      const node = append(controls, 'button', text);
      node.type = 'button';
      node.addEventListener('click', action);
      return node;
    };
    const start = button(t('resourcesStart'), startCapture);
    const stop = button(t('resourcesStop'), () => finish());
    const reload = button(t('resourcesReload'), async () => {
      try {
        await checkTarget();
        await browserApi.tabs.reload(tabId);
      } catch (_error) {
        discard('NAVIGATED');
      }
    });
    const clear = button(t('resourcesClear'), () => discard('CLEARED'));
    const settings = button(t('resourcesSettings'), () => browserApi.runtime.openOptionsPage());
    const status = append(container, 'p', '', 'resource-status');
    status.setAttribute('role', 'status');
    const results = append(container, 'section');
    const notice = append(container, 'p', '', 'resource-warning');
    notice.setAttribute('role', 'status');
    let saveButton = null;

    function message(key) {
      notice.textContent = key ? t(key) : '';
    }

    function unlisten() {
      if (!listening) return;
      for (const [event, callback] of listeners) event.removeListener(callback);
      listening = false;
    }

    const receive = (kind) => (details) => {
      if (!capture) return;
      capture.observe(kind, details);
      if (capture.snapshot().phase !== 'CAPTURING') unlisten();
    };
    const listeners = [
      [browserApi.webRequest.onBeforeRequest, receive('START')],
      [browserApi.webRequest.onCompleted, receive('DONE')],
      [browserApi.webRequest.onErrorOccurred, receive('ERROR')],
    ];

    async function checkTarget() {
      const tab = await browserApi.tabs.get(tabId);
      if (browserApi.extension && browserApi.extension.inIncognitoContext ||
          !tab || tab.incognito !== false || Core.hostFromUrl(tab.url) !== host || !host) {
        throw new Error('RESOURCE_TARGET_INVALID');
      }
      return tab;
    }

    function updateControls() {
      const active = capture && capture.snapshot().phase === 'CAPTURING';
      start.disabled = busy || active || !host;
      stop.disabled = busy || !capture || capture.snapshot().phase === 'CLEARED';
      reload.disabled = busy || !active;
      clear.disabled = busy || !capture;
      settings.disabled = busy;
      if (saveButton) saveButton.disabled = busy || !snapshot || !snapshot.canProxy || !selection.size;
    }

    async function startCapture() {
      if (busy) return;
      busy = true;
      message('');
      updateControls();
      try {
        await checkTarget();
        unlisten();
        if (capture) capture.clear();
        capture = Core.createCapture({tabId, host});
        snapshot = null;
        selection.clear();
        results.replaceChildren();
        saveButton = null;
        listening = true;
        for (const [event, callback] of listeners) {
          event.addListener(callback, {urls: ['http://*/*', 'https://*/*'], tabId});
        }
        lastPhase = 'CAPTURING';
        status.textContent = t('resourcesCapturing', ['0']);
      } catch (_error) {
        unlisten();
        if (capture) capture.clear();
        message('resourcesUnavailable');
      } finally {
        busy = false;
        updateControls();
      }
    }

    function discard(reason) {
      if (capture) capture.clear(reason);
      unlisten();
      snapshot = null;
      selection.clear();
      results.replaceChildren();
      saveButton = null;
      lastPhase = 'CLEARED';
      status.textContent = t(reason === 'NAVIGATED' ? 'resourcesNavigated' :
        reason === 'EXPIRED' ? 'resourcesExpired' : 'resourcesCleared');
      message('');
      if (reason === 'NAVIGATED') host = '';
      updateControls();
    }

    async function finish() {
      if (!capture || busy) return;
      capture.stop();
      unlisten();
      lastPhase = 'STOPPED';
      busy = true;
      updateControls();
      try {
        await checkTarget();
        const current = capture;
        const saved = await adapter.read();
        if (capture !== current || capture.snapshot().phase !== 'STOPPED' || !host) return;
        snapshot = saved;
        renderResults();
      } catch (_error) {
        message('resourcesReadFailed');
      } finally {
        busy = false;
        updateControls();
      }
    }

    function renderResults() {
      selection.clear();
      results.replaceChildren();
      const view = capture.snapshot();
      status.textContent = t(view.reason === 'LIMIT' ? 'resourcesLimited' : 'resourcesStopped',
          [String(view.rows.length)]);
      append(results, 'h2', t('resourcesResults'));
      append(results, 'p', t('resourcesCaution'), 'resource-warning');
      if (!view.rows.length) append(results, 'p', t('resourcesEmpty'));
      for (const row of view.rows) {
        const state = Core.ruleState(row.host, snapshot.rules);
        const label = append(results, 'label', '', 'resource-row');
        const checkbox = append(label, 'input');
        checkbox.type = 'checkbox';
        checkbox.disabled = state !== 'NONE' || !snapshot.canProxy;
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selection.add(row.host);
          else selection.delete(row.host);
          updateControls();
        });
        const detail = append(label, 'span');
        append(detail, 'strong', row.host);
        append(detail, 'small', t('resourcesCounts', [String(row.requests), String(row.failures)]) +
          ' · ' + row.types.map((type) => t(`resourcesType_${type}`)).join(', '));
        if (state !== 'NONE') append(detail, 'small', t(`resourcesRule${state}`));
      }
      if (!snapshot.canProxy) append(results, 'p', t('resourcesProxyRequired'), 'resource-warning');
      append(results, 'p', t('resourcesGlobalScope'), 'resource-warning');
      saveButton = append(results, 'button', t('resourcesSave'));
      saveButton.type = 'button';
      saveButton.addEventListener('click', save);
      updateControls();
    }

    async function save() {
      if (busy || !snapshot || !capture || capture.snapshot().phase !== 'STOPPED') return;
      const current = capture;
      busy = true;
      updateControls();
      message('');
      try {
        await checkTarget();
        if (capture !== current || capture.snapshot().phase !== 'STOPPED' || !host) return;
        await adapter.save(snapshot, Array.from(selection), capture.snapshot().rows);
        snapshot = null;
        selection.clear();
        results.replaceChildren();
        saveButton = null;
        message('resourcesSaved');
      } catch (_error) {
        // A stale revision is not merged or retried automatically.
        message('resourcesSaveFailed');
      } finally {
        busy = false;
        updateControls();
      }
    }

    const onUpdated = (id, change) => {
      if (id === tabId && change.url && Core.hostFromUrl(change.url) !== host) discard('NAVIGATED');
    };
    const onRemoved = (id) => {
      if (id === tabId) discard('NAVIGATED');
    };
    browserApi.tabs.onUpdated.addListener(onUpdated);
    browserApi.tabs.onRemoved.addListener(onRemoved);
    const timer = win.setInterval(() => {
      if (!capture) return;
      const view = capture.snapshot();
      if (view.phase === 'CAPTURING') status.textContent = t('resourcesCapturing', [String(view.rows.length)]);
      else if (view.phase !== lastPhase) {
        if (view.phase === 'CLEARED') discard(view.reason);
        else finish();
      }
    }, 1000);
    win.addEventListener('pagehide', () => {
      if (capture) capture.clear();
      unlisten();
      win.clearInterval(timer);
      browserApi.tabs.onUpdated.removeListener(onUpdated);
      browserApi.tabs.onRemoved.removeListener(onRemoved);
      snapshot = null;
      selection.clear();
    }, {once: true});

    const ready = (async () => {
      busy = true;
      updateControls();
      try {
        if (!Number.isSafeInteger(tabId) || tabId < 0) throw new Error('RESOURCE_TARGET_INVALID');
        const tab = await browserApi.tabs.get(tabId);
        host = Core.hostFromUrl(tab && tab.url);
        await checkTarget();
        await adapter.read();
        // Chromium may have a separately selected UI language.
        doc.title = title.textContent = t('resourcesTitle');
        target.textContent = host;
        intro.textContent = t('resourcesIntro');
        privacySummary.textContent = t('resourcesPrivacySummary');
        privacyHeading.textContent = t('resourcesDetails');
        privacy.textContent = t('resourcesPrivacy');
        [start, stop, reload, clear, settings].forEach((node, index) => {
          node.textContent = t(['resourcesStart', 'resourcesStop', 'resourcesReload',
            'resourcesClear', 'resourcesSettings'][index]);
        });
        status.textContent = t('resourcesIdle');
      } catch (_error) {
        host = '';
        message('resourcesUnavailable');
      } finally {
        busy = false;
        updateControls();
      }
    })();
    return Object.freeze({ready});
  }
  root.rucbSiteResourcesUi = Object.freeze({mount});
})(typeof globalThis === 'object' ? globalThis : this);
