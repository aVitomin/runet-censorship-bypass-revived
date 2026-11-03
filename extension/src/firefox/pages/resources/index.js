'use strict';

const resourcesRpc = window.rucbFirefoxUi.createRpc(browser);
window.rucbSiteResourcesUi.mount({
  browserApi: browser,
  adapter: window.rucbSiteResources.createAdapter({
    family: 'firefox', rpc: (message) => resourcesRpc.call(message),
  }),
  translate: (key, values) => window.rucbFirefoxUi.translate(browser, key, values),
});
