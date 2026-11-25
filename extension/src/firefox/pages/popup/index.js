'use strict';
/* global globalThis, module, require */

(function publishFirefoxPopup(root, factory) {

  const runtime = typeof module === 'object' && module.exports ?
    require('../shared/ui-runtime') : root.rucbFirefoxUi;
  const dataStatus = typeof module === 'object' && module.exports ?
    require('../../../shared/routing-data-status') : root.rucbRoutingDataStatus;
  const api = factory(runtime, dataStatus);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  root.rucbFirefoxPopup = api;
  root.document.addEventListener('DOMContentLoaded', () => {
    api.mount(root.document, root.browser);
  });

})(typeof globalThis === 'object' ? globalThis : this, function(Ui, DataStatus) {

  const SITE_KEYS = Object.freeze([
    'patterns', 'proxyCandidateAvailable', 'revision', 'route',
    'schemaVersion', 'target',
  ]);
  const TARGET_KEYS = Object.freeze(['controllable', 'host', 'reasonCode']);
  const ROUTE_KEYS = Object.freeze(['mode', 'pattern', 'scope']);
  const PATTERN_KEYS = Object.freeze([
    'exact', 'wildcard', 'wildcardAvailable',
  ]);
  const MODES = Object.freeze(['AUTO', 'PROXY', 'DIRECT']);
  const SCOPES = Object.freeze(['HOST', 'DOMAIN']);

  function presentation(capabilities) {

    const value = Ui.validateCapabilities(capabilities);
    const privateDenied = value.privateWindowAccess !== 'GRANTED';
    const ownsProtectedIntent = value.durableIntent === 'ON' ||
      value.runtimeState === 'READY';
    if (value.recoveryStatus === 'BLOCKED_CONTROL_LOSS' ||
        value.recoveryFailureCode === 'CONTROL_LOSS') {
      return Object.freeze({
        kind: 'EXTERNAL', tone: 'error',
        action: value.durableIntent === 'ON' ? 'DISABLE' : 'NONE',
        titleKey: 'popupStateExternal', helpKey: 'popupHelpExternal',
      });
    }
    if (privateDenied && ownsProtectedIntent) {
      return Object.freeze({
        kind: 'BLOCKED', tone: 'error', action: 'DISABLE',
        titleKey: 'popupStateBlocked', helpKey: 'popupHelpPrivateBlocked',
      });
    }
    if (value.runtimeState === 'READY') {
      const recovered = value.recoveryStatus === 'RECOVERED';
      return Object.freeze({
        kind: recovered ? 'RECOVERED' : 'ACTIVE',
        tone: 'success',
        action: 'DISABLE',
        titleKey: recovered ? 'popupStateRecovered' : 'popupStateActive',
        helpKey: recovered ? 'popupHelpRecovered' : 'popupHelpActive',
      });
    }
    if (value.runtimeState === 'INITIALIZING' ||
        value.recoveryStatus === 'INITIALIZING') {
      return Object.freeze({
        kind: 'INITIALIZING', tone: 'warning', action: 'NONE',
        titleKey: 'popupStateInitializing', helpKey: 'popupHelpInitializing',
      });
    }
    if (value.runtimeState === 'FAILED' ||
        value.recoveryStatus.startsWith('BLOCKED') ||
        value.recoveryStatus.includes('FAILED')) {
      return Object.freeze({
        kind: 'BLOCKED', tone: 'error',
        action: value.durableIntent === 'ON' ? 'DISABLE' : 'NONE',
        titleKey: 'popupStateBlocked', helpKey: 'popupHelpBlocked',
      });
    }
    return Object.freeze({
      kind: 'OFF', tone: '', action: 'ENABLE',
      titleKey: 'popupStateOff',
      helpKey: privateDenied ? 'popupHelpPrivateRequired' :
        !value.providerDatasetAvailable ? 'popupHelpDatasetMissing' :
          'popupHelpOff',
    });

  }

  function userErrorKey(code) {

    if (code === 'PRIVATE_ACCESS_REQUIRED') {
      return 'popupErrorPrivateAccess';
    }
    if (code === 'PRIVATE_ACCESS_CHECK_FAILED') {
      return 'popupErrorPrivateAccessCheck';
    }
    if (String(code).includes('DATASET')) {
      return 'popupErrorDataset';
    }
    if (code === 'SITE_PROXY_CANDIDATE_UNAVAILABLE') {
      return 'popupErrorProxyCandidate';
    }
    if (code === 'SETTINGS_REVISION_CONFLICT' ||
        code === 'STALE_REVISION') {
      return 'popupErrorRevision';
    }
    if (String(code).includes('PRODUCT_CONFIG') ||
        String(code).includes('SETTINGS') ||
        code === 'REQUIRED_CREDENTIAL_MISSING') {
      return 'popupErrorSettings';
    }
    return 'popupErrorGeneric';

  }

  function validateSiteState(value) {

    if (!Ui.hasExactKeys(value, SITE_KEYS) || value.schemaVersion !== 1 ||
        !Number.isSafeInteger(value.revision) || value.revision < 0 ||
        !Ui.hasExactKeys(value.target, TARGET_KEYS) ||
        typeof value.target.controllable !== 'boolean' ||
        typeof value.target.host !== 'string' ||
        (value.target.reasonCode !== null &&
          typeof value.target.reasonCode !== 'string') ||
        typeof value.proxyCandidateAvailable !== 'boolean') {
      throw Ui.rpcError('UI_RPC_FAILED');
    }
    if (!value.target.controllable) {
      if (value.route !== null || value.patterns !== null ||
          value.target.host !== '') {
        throw Ui.rpcError('UI_RPC_FAILED');
      }
    } else if (!Ui.hasExactKeys(value.route, ROUTE_KEYS) ||
        !MODES.includes(value.route.mode) ||
        !SCOPES.includes(value.route.scope) ||
        typeof value.route.pattern !== 'string' ||
        !Ui.hasExactKeys(value.patterns, PATTERN_KEYS) ||
        typeof value.patterns.exact !== 'string' ||
        typeof value.patterns.wildcard !== 'string' ||
        typeof value.patterns.wildcardAvailable !== 'boolean') {
      throw Ui.rpcError('UI_RPC_FAILED');
    }
    return Object.freeze(Ui.clone(value));

  }

  function isDraftDirty(site, draft) {

    return Boolean(site && site.target.controllable && draft &&
      (site.route.mode !== draft.mode ||
        draft.mode !== 'AUTO' && site.route.scope !== draft.scope));

  }

  function activationAllowed(capabilities) {

    const value = Ui.validateCapabilities(capabilities);
    return value.activationSupported && value.providerDatasetAvailable &&
      value.privateWindowAccess === 'GRANTED';

  }

  function createController(options = {}) {

    const rpc = options.rpc;
    const getActiveTabUrl = options.getActiveTabUrl;
    const changed = typeof options.changed === 'function' ?
      options.changed : () => {};
    if (!rpc || typeof rpc.call !== 'function' ||
        typeof getActiveTabUrl !== 'function') {
      throw Ui.rpcError('UI_RPC_FAILED');
    }
    let state = {
      capabilities: null,
      errorCode: null,
      operation: null,
      operational: null,
      pending: false,
      site: null,
      tabUrl: '',
      configuration: null,
      notice: null,
      routingData: null,
      routingUpdateResult: null,
    };

    function snapshot() {

      return Object.freeze(Object.assign({}, state));

    }

    function emit() {

      changed(snapshot());

    }

    async function readAll() {

      let tabUrl = '';
      try {
        const candidate = await getActiveTabUrl();
        tabUrl = typeof candidate === 'string' ? candidate : '';
      } catch (_error) {
        // An unreadable privileged tab is represented as uncontrollable.
      }
      const result = await rpc.call({type: 'firefox.popup.get', tabUrl});
      if (!Ui.hasExactKeys(result, ['capabilities', 'site', 'operational',
        'configuration', 'routingData'])) throw Ui.rpcError('UI_RPC_FAILED');
      const capabilities = Ui.validateCapabilities(result.capabilities);
      const site = validateSiteState(result.site);
      const operational = Ui.validateOperationalStatus(result.operational);
      const configuration = Ui.validateConfiguration(result.configuration);
      const routingData = DataStatus.validate(result.routingData);
      state.capabilities = capabilities;
      state.site = site;
      state.operational = operational;
      state.configuration = configuration;
      state.routingData = routingData;
      state.tabUrl = tabUrl;

    }

    async function refresh() {

      if (state.pending) {
        return false;
      }
      state = Object.assign({}, state, {
        errorCode: null, operation: 'REFRESH', pending: true,
      });
      emit();
      try {
        await readAll();
        return true;
      } catch (error) {
        state.errorCode = Ui.safeErrorCode(error);
        return false;
      } finally {
        state.operation = null;
        state.pending = false;
        emit();
      }

    }

    async function checkPrivateAccess() {

      if (state.pending) {
        return false;
      }
      state = Object.assign({}, state, {
        errorCode: null, operation: 'PRIVATE_ACCESS', pending: true,
      });
      emit();
      try {
        state.capabilities = Ui.validateCapabilities(await rpc.call({
          type: 'firefox.capabilities.get',
        }));
        state.configuration = Ui.validateConfiguration(await rpc.call({type: 'firefox.configuration.get'}));
        return true;
      } catch (error) {
        state.errorCode = Ui.safeErrorCode(error);
        return false;
      } finally {
        state.operation = null;
        state.pending = false;
        emit();
      }

    }

    async function operate(kind, draft = null, applyAll = false) {

      if (state.pending || kind === 'ENABLE' && !state.configuration) {
        return false;
      }
      state = Object.assign({}, state, {
        errorCode: null, notice: null, operation: kind, pending: true,
      });
      emit();
      try {
        if (kind === 'ENABLE' && isDraftDirty(state.site, draft)) {
          const result = await rpc.call({
            type: 'firefox.site.apply',
            tabUrl: state.tabUrl,
            expectedRevision: state.configuration.savedRevision,
            expectedEffectiveId: state.configuration.effectiveId,
            mode: draft.mode,
            scope: draft.scope,
            applyAll,
          });
          await readAll();
          if (!result.applied) {
            state.errorCode = result.errorCode;
            state.notice = result.previousActive ? 'SITE_SAVED_NOT_APPLIED' : null;
            return false;
          }
        } else {
          const type = kind === 'ENABLE' ?
            'firefox.activation.apply' : 'firefox.activation.clear';
          await rpc.call(kind === 'ENABLE' ?
            {type, expectedRevision: state.configuration.savedRevision,
              expectedEffectiveId: state.configuration.effectiveId} : {type});
          await readAll();
        }
        state.notice = 'APPLIED';
        return true;
      } catch (error) {
        state.errorCode = Ui.safeErrorCode(error);
        try {
          await readAll();
        } catch (_refreshError) {
          // Keep the original sanitized operation error.
        }
        return false;
      } finally {
        state.operation = null;
        state.pending = false;
        emit();
      }

    }

    async function checkHealth() {

      if (state.pending) {
        return false;
      }
      state = Object.assign({}, state, {
        errorCode: null, operation: 'HEALTH', pending: true,
      });
      emit();
      try {
        Ui.validateHealth(await rpc.call({
          type: 'firefox.health.check',
          tabUrl: state.tabUrl,
        }));
        await readAll();
        return true;
      } catch (error) {
        state.errorCode = Ui.safeErrorCode(error);
        try {
          await readAll();
        } catch (_refreshError) {
          // Keep the original sanitized health error.
        }
        return false;
      } finally {
        state.operation = null;
        state.pending = false;
        emit();
      }

    }

    async function refreshRoutingData() {

      if (state.pending || !state.routingData || !state.routingData.canCheck ||
          state.routingData.updating) return false;
      state = Object.assign({}, state, {
        operation: 'DATA_UPDATE', pending: true, routingUpdateResult: null,
      });
      emit();
      try {
        const result = await rpc.call({type: 'firefox.routingData.refresh'});
        state.routingUpdateResult = result && DataStatus.RESULTS.includes(result.status) ?
          result.status : 'FAILED';
        await readAll();
        return state.routingUpdateResult !== 'FAILED';
      } catch (_error) {
        state.routingUpdateResult = 'FAILED';
        return false;
      } finally {
        state.operation = null;
        state.pending = false;
        emit();
      }

    }

    return Object.freeze({
      apply: (draft, applyAll) => operate('ENABLE', draft, applyAll),
      refreshRoutingData,
      checkHealth,
      checkPrivateAccess,
      clear: () => operate('DISABLE'),
      refresh,
      snapshot,
    });

  }

  function mount(document, browserApi) {

    const root = document.getElementById('popup-root');
    if (!root) {
      return null;
    }
    const t = (key, substitutions) =>
      Ui.translate(browserApi, key, substitutions);
    let draft = null;
    let renderedRevision = null;
    let resourceTab = null;
    const controller = createController({
      rpc: Ui.createRpc(browserApi),
      async getActiveTabUrl() {

        if (!browserApi.tabs || typeof browserApi.tabs.query !== 'function') {
          return '';
        }
        const tabs = await browserApi.tabs.query({
          active: true,
          currentWindow: true,
        });
        resourceTab = tabs && tabs[0] || null;
        return tabs && tabs[0] && typeof tabs[0].url === 'string' ?
          tabs[0].url : '';

      },
      changed: render,
    });

    function openSettings(section = '') {

      if (section) {
        const url = browserApi.runtime.getURL(
            `pages/options/index.html#${section}`,
        );
        browserApi.tabs.create({url});
        return;
      }
      browserApi.runtime.openOptionsPage();

    }

    function modeDescription(mode) {

      return t(mode === 'PROXY' ? 'popupProxyModeDescription' :
        mode === 'DIRECT' ? 'popupDirectModeDescription' :
          'popupAutoModeDescription');

    }

    function healthText(health) {

      if (health.status === 'OK') {
        return t('healthStatusOk');
      }
      if (health.status === 'ERROR') {
        return t('healthStatusError');
      }
      if (health.status === 'INCONCLUSIVE') {
        return t('healthStatusInconclusive');
      }
      return t('healthStatusUnknown');

    }

    function renderRoute(card, state, editable) {

      const site = state.site;
      if (!site.target.controllable) {
        Ui.appendText(
            card, 'p', t('popupPageCannotBeControlledHelp'), 'muted',
        );
        return;
      }
      const fieldset = Ui.append(card, 'fieldset', 'route-fieldset');
      Ui.appendText(
          fieldset, 'legend', t('popupSiteModeGroup', [site.target.host]),
          'sr-only',
      );
      const choices = Ui.append(fieldset, 'div', 'route-segments');
      for (const mode of MODES) {
        const label = Ui.append(choices, 'label', 'route-option');
        const input = Ui.append(label, 'input');
        input.type = 'radio';
        input.name = 'site-mode';
        input.value = mode;
        input.checked = draft.mode === mode;
        input.disabled = !editable;
        input.addEventListener('change', () => {
          if (input.checked) {
            draft.mode = mode;
            render(state, 'site-mode', mode);
          }
        });
        Ui.appendText(label, 'span', t(`popupMode${mode}`));
      }
      Ui.appendText(card, 'p', modeDescription(draft.mode), 'muted route-help');
      if (draft.mode !== 'AUTO') {
        const scope = Ui.append(card, 'fieldset', 'scope-fieldset');
        Ui.appendText(scope, 'legend', t('popupScope'));
        for (const value of SCOPES) {
          const label = Ui.append(scope, 'label', 'scope-option');
          const input = Ui.append(label, 'input');
          input.type = 'radio';
          input.name = 'site-scope';
          input.value = value;
          input.checked = draft.scope === value;
          input.disabled = !editable ||
            value === 'DOMAIN' && !site.patterns.wildcardAvailable;
          input.addEventListener('change', () => {
            if (input.checked) {
              draft.scope = value;
              render(state, 'site-scope', value);
            }
          });
          Ui.appendText(label, 'span', t(value === 'HOST' ?
            'popupHostOnly' : 'popupDomainAndSubdomains'));
        }
        const pattern = draft.scope === 'DOMAIN' &&
          site.patterns.wildcardAvailable ?
          site.patterns.wildcard : site.patterns.exact;
        Ui.appendText(
            card, 'p', t('popupRulePreview', [pattern]), 'pattern-preview',
        );
      }
    }

    function action(parent, label, callback, disabled, primary = false) {

      const button = Ui.appendText(parent, 'button', t(label), primary ? 'primary' : '');
      button.type = 'button';
      button.disabled = disabled;
      button.addEventListener('click', callback);
      return button;

    }

    function renderDetails(state, health, showHealthAction, detailsOpen) {

      const details = Ui.append(root, 'details', 'card facts-card');
      details.open = detailsOpen;
      Ui.appendText(details, 'summary', t('popupDetails'));
      const facts = Ui.append(details, 'div', 'details-body');
      if (health && showHealthAction) {
        Ui.appendText(facts, 'p', healthText(health), 'muted');
        action(facts, health.status === 'ERROR' ? 'healthCheckAgain' : 'healthCheckAction',
            () => controller.checkHealth(), state.pending);
      }
      DataStatus.render(facts, {
        status: state.routingData, pending: state.pending,
        result: state.routingUpdateResult, translate: t,
        onCheck: () => controller.refreshRoutingData(),
      });
      action(facts, 'resourcesTitle', () => {
        browserApi.tabs.create({url: browserApi.runtime.getURL(`pages/resources/index.html#${resourceTab.id}`)});
      }, !resourceTab || resourceTab.incognito !== false ||
        !Number.isSafeInteger(resourceTab.id) || !state.site.target.controllable);

    }

    function render(state, focusName, focusValue) {

      if (state.site && state.site.target.controllable &&
          (!draft || state.notice === 'APPLIED' && renderedRevision !== state.site.revision)) {
        draft = {
          mode: state.site.route.mode,
          scope: state.site.route.scope,
        };
        renderedRevision = state.site.revision;
      }
      const previousDetails = root.querySelector('details');
      Ui.clear(root);
      root.setAttribute('aria-busy', state.pending ? 'true' : 'false');
      document.title = t('popupTitle');
      const header = Ui.append(root, 'header', 'popup-header');
      Ui.appendText(header, 'h1', t('popupCurrentSiteRouting'));
      const settings = Ui.append(header, 'button', 'settings-button');
      settings.type = 'button';
      settings.textContent = t('actionSettings');
      settings.disabled = state.pending;
      settings.addEventListener('click', () => openSettings());
      if (!state.capabilities || !state.site || !state.operational) {
        const loading = Ui.append(root, 'section', 'card control-card');
        Ui.appendText(
            loading,
            'p',
            state.errorCode ? t('popupLoadFailed') : t('popupLoading'),
            `status ${state.errorCode ? 'error' : ''}`,
        );
        if (state.errorCode && !state.pending) {
          const retry = Ui.append(loading, 'button', 'primary');
          retry.type = 'button';
          retry.textContent = t('actionRetry');
          retry.addEventListener('click', () => controller.refresh());
        }
        return;
      }
      const view = presentation(state.capabilities);
      const configuration = state.configuration;
      const ready = view.kind === 'ACTIVE' || view.kind === 'RECOVERED';
      const canEdit = ready || view.kind === 'OFF';
      const canApply = activationAllowed(state.capabilities);
      const privateRequired = state.capabilities.privateWindowAccess !== 'GRANTED';
      const dirty = isDraftDirty(state.site, draft);
      const proxyUnavailable = state.site.target.controllable && draft.mode === 'PROXY' &&
        !state.site.proxyCandidateAvailable && (dirty || !configuration.pending);
      const health = ready && state.site.route && state.site.route.mode === 'PROXY' ?
        state.operational.health : null;
      const savedPending = configuration.pending && canEdit;
      const sourceUnavailable = !state.capabilities.providerDatasetAvailable;
      const needsSetup = view.kind === 'OFF' && !configuration.effectiveId &&
        configuration.savedRevision === 0 && !dirty;
      const checkAtTop = health && !privateRequired && !proxyUnavailable &&
        !savedPending && canApply && !dirty && configuration.active;
      const card = Ui.append(root, 'section', 'card site-card');
      Ui.appendText(card, 'h2', state.site.target.controllable ? state.site.target.host :
        t('popupCurrentTabUnavailable'), 'site-host');
      const statusKey = state.operation === 'ENABLE' || configuration.applying ? 'unifiedApplying' :
        configuration.blocked && view.kind !== 'EXTERNAL' ? 'popupStateBlocked' : view.titleKey;
      const tone = statusKey === 'unifiedApplying' ? 'warning' :
        configuration.blocked ? 'error' : view.tone;
      Ui.appendText(card, 'p', t(statusKey), `pill ${tone}`);
      if (!canEdit || view.kind === 'RECOVERED') {
        Ui.appendText(card, 'p', t(view.helpKey), 'muted');
      }
      if (statusKey === 'unifiedApplying' && configuration.active) {
        Ui.appendText(card, 'p', t('unifiedPreparing'), 'muted');
      }
      renderRoute(card, state, canEdit && !state.pending);
      const permissionNotice = Ui.renderPrivateAccessOnboarding(card, state.capabilities, {
        checkAgain: () => controller.checkPrivateAccess(), pending: state.pending, translate: t,
      });
      if (permissionNotice && view.kind !== 'EXTERNAL') permissionNotice.check.classList.add('primary');
      if (canEdit && !privateRequired && sourceUnavailable) {
        Ui.appendText(card, 'p', t('popupHelpDatasetMissing'), 'status warning');
      }
      if (dirty) {
        const oldMode = t(`popupMode${state.site.route.mode}`);
        const newMode = t(`popupMode${draft.mode}`);
        const change = oldMode === newMode ? t('popupScopeNotApplied') :
          t('unifiedTransition', [oldMode, newMode]);
        Ui.appendText(card, 'p', change, 'status warning');
      }
      if (proxyUnavailable) {
        Ui.appendText(card, 'p', t('popupProxyRouteNeedsMethod'), 'status warning');
      }
      if (savedPending) {
        Ui.appendText(card, 'p', t('unifiedPopupPending'), 'status warning pending-note');
      }
      if (checkAtTop) Ui.appendText(card, 'p', healthText(health), 'muted');
      if (state.errorCode) {
        const error = Ui.appendText(
            card, 'p', t(state.notice === 'SITE_SAVED_NOT_APPLIED' ? 'unifiedSiteSaved' :
              ['SAVED_REVISION_CHANGED', 'SETTINGS_REVISION_CONFLICT', 'PENDING_CONFIRMATION_REQUIRED'].includes(state.errorCode) ?
                'unifiedPopupConflict' : userErrorKey(state.errorCode)),
            'status error message',
        );
        error.setAttribute('role', 'alert');
      }
      const actions = Ui.append(card, 'div', 'actions');
      if (canEdit && !privateRequired) {
        if (proxyUnavailable) {
          action(actions, 'popupConfigureProxyMethods', () => openSettings('proxy-connections'), state.pending, true);
        } else if (sourceUnavailable) {
          action(actions, 'optionsNavAutomaticRouting',
              () => openSettings('automatic-routing'), state.pending, true);
        } else if (needsSetup) {
          action(actions, 'setupOpen', () => openSettings('overview'), state.pending, true);
        } else if (savedPending || !canApply) {
          action(actions, 'unifiedReview', () => openSettings(), state.pending, true);
          if (savedPending && canApply) {
            action(actions, 'unifiedApplyAll', () => controller.apply(draft, true), state.pending);
          }
        } else if (dirty || !configuration.active) {
          action(actions, configuration.active ? 'unifiedApply' : 'unifiedApplyOn',
              () => controller.apply(draft, false), state.pending, true);
        } else if (checkAtTop) {
          action(actions, health.status === 'ERROR' ? 'healthCheckAgain' : 'healthCheckAction',
              () => controller.checkHealth(), state.pending, true);
        }
      }
      if (view.action === 'DISABLE') {
        action(actions, 'popupTurnOff', () => controller.clear(), state.pending);
      }
      renderDetails(state, health, !checkAtTop, Boolean(previousDetails && previousDetails.open));
      const live = Ui.appendText(
          root,
          'p',
          state.pending ? t('popupOperationPending') : t(statusKey),
          'sr-only',
      );
      live.setAttribute('aria-live', 'polite');
      if (focusName) {
        root.querySelector(`input[name="${focusName}"][value="${focusValue}"]`).focus();
      }

    }

    controller.refresh();
    return controller;

  }

  return Object.freeze({
    activationAllowed,
    createController,
    isDraftDirty,
    mount,
    presentation,
    userErrorKey,
    validateSiteState,
  });

});
