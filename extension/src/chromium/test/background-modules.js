'use strict';


const Crypto = require('crypto');
const Path = require('path');

const BACKGROUND_DIRECTORY = Path.resolve(__dirname, '..', 'background');
const BACKGROUND_FILES = Object.freeze([
  'pac-artifacts.js',
  'pac-mods.js',
  'site-scope.js',
  'proxy-health.js',
  'pac-providers.js',
  'state.js',
  'action-status.js',
  'periodic-update.js',
  'hash.js',
  'pac-download.js',
  'pac-cook.js',
  'domain-provider-pac.js',
  'proxy-auth.js',
  'proxy-settings.js',
]);
const BACKGROUND_EXPORTS = Object.freeze([
  'mv3PacArtifacts',
  'mv3PacMods',
  'mv3SiteScope',
  'mv3ProxyHealth',
  'mv3Providers',
  'mv3State',
  'mv3ActionStatus',
  'mv3PeriodicUpdate',
  'mv3Hash',
  'mv3PacDownload',
  'mv3PacCook',
  'mv3DomainProviderPac',
  'mv3ProxyAuth',
  'mv3ProxySettings',
]);

function loadBackgroundModules() {

  BACKGROUND_EXPORTS.forEach((name) => delete global[name]);
  global.self = global;
  global.tldts = require('tldts');
  global.rucbDomainBlockCodec = require('../../shared/domain-block-codec');
  global.rucbAntifilterSource = require('../../shared/antifilter-source');
  if (!global.crypto) {
    global.crypto = Crypto.webcrypto;
  }
  BACKGROUND_FILES.forEach((file) => {
    const filename = Path.join(BACKGROUND_DIRECTORY, file);
    delete require.cache[require.resolve(filename)];
    require(filename);
  });
  return global;

}

module.exports = {
  BACKGROUND_DIRECTORY,
  loadBackgroundModules,
};
