'use strict';

window.rucbSiteResourcesUi.mount({
  browserApi: chrome,
  adapter: window.rucbSiteResources.createAdapter({
    family: 'chromium', rpc: window.mv3Rpc.callBackground,
    initLanguage: window.mv3I18n.init,
  }),
  translate: window.mv3I18n.t,
});
