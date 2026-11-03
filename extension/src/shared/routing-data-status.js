'use strict';

(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.rucbRoutingDataStatus = api;
})(globalThis, function() {

  const SOURCES = ['none', 'manual', 'antifilter', 'anticensority', 'antizapret', 'custom'];
  const RESULTS = ['UNCHANGED', 'APPLIED', 'PREPARED', 'DEFERRED', 'FAILED', 'UNAVAILABLE'];
  const KEYS = ['source', 'sourceUpdatedAt', 'lastCheckedAt', 'canCheck', 'updating', 'active'];
  const OLD_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

  function timestamp(value) {
    return value === null || Number.isSafeInteger(value) && value > 0;
  }

  function validate(value) {
    if (!value || Object.keys(value).length !== KEYS.length ||
        !KEYS.every((key) => Object.prototype.hasOwnProperty.call(value, key)) ||
        !SOURCES.includes(value.source) || !timestamp(value.sourceUpdatedAt) ||
        !timestamp(value.lastCheckedAt) ||
        ['canCheck', 'updating', 'active'].some((key) => typeof value[key] !== 'boolean')) {
      throw new TypeError('INVALID_ROUTING_DATA_STATUS');
    }
    return Object.freeze(Object.assign({}, value));
  }

  function freshness(status, now = Date.now()) {
    if (['manual', 'none'].includes(status.source)) return 'NONE';
    // An unknown/future date is not evidence of freshness. This is a display
    // warning only: it never disables routing or replaces verified data.
    if (!status.sourceUpdatedAt || status.sourceUpdatedAt > now + 5 * 60 * 1000) return 'UNKNOWN';
    return now - status.sourceUpdatedAt > OLD_AFTER_MS ? 'OLD' : 'DATED';
  }

  function render(parent, options) {
    const {status, pending, result, onCheck, translate: t} = options;
    const doc = parent.ownerDocument;
    function append(tag, text, className = '') {
      const element = doc.createElement(tag);
      element.className = className;
      element.textContent = text;
      parent.appendChild(element);
      return element;
    }
    parent.classList.add('routing-data-card');
    parent.setAttribute('aria-label', t('routingDataTitle'));
    append('h2', t('routingDataTitle'));
    if (!status) {
      append('p', t('routingDataUnavailable'), 'routing-data-note');
      return;
    }
    append('p', t(`routingDataSource_${status.source}`), 'routing-data-source');
    const locale = doc.documentElement && doc.documentElement.lang || undefined;
    const date = (value) => value ? new Date(value).toLocaleString(locale) :
      t('routingDataUnknown');
    if (!['none', 'manual'].includes(status.source)) {
      const facts = doc.createElement('dl');
      facts.className = 'routing-data-facts';
      parent.appendChild(facts);
      for (const [key, value] of [['routingDataSourceDate', status.sourceUpdatedAt],
        ['routingDataLastCheck', status.lastCheckedAt]]) {
        const term = doc.createElement('dt'); term.textContent = t(key);
        const detail = doc.createElement('dd'); detail.textContent = date(value);
        facts.appendChild(term); facts.appendChild(detail);
      }
    }
    const age = freshness(status);
    if (['UNKNOWN', 'OLD'].includes(age)) {
      append('p', t(`routingDataAge_${age}`), 'routing-data-warning');
    }
    const button = append('button', t(status.updating || pending ? 'routingDataChecking' :
      'routingDataCheck'), 'routing-data-button ui-button');
    button.type = 'button';
    button.disabled = !status.canCheck || pending || status.updating;
    button.dataset.focusKey = 'routing-data-check';
    button.onclick = onCheck;
    if (!status.canCheck) append('p', t(['none', 'manual'].includes(status.source) ?
      'routingDataNoSource' : 'routingDataUnavailable'), 'routing-data-note');
    if (RESULTS.includes(result)) {
      const message = append('p', t(`routingDataResult_${result}`),
          result === 'FAILED' ? 'routing-data-error' : 'routing-data-note');
      message.setAttribute('role', result === 'FAILED' ? 'alert' : 'status');
    }
  }

  return Object.freeze({validate, freshness, render, RESULTS, OLD_AFTER_MS});
});
