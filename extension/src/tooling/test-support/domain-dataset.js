'use strict';

const Crypto = require('node:crypto');
const Codec = require('../../shared/domain-block-codec');
const Dataset = require('../../shared/provider-dataset');

const sha256 = (bytes) => Crypto.createHash('sha256').update(bytes).digest('hex');

function compactArtifact(options = {}) {
  const payload = options.payload || Codec.encode([
    'blocked.example', 'xn--e1afmkfd.xn--p1ai', 'under_score.example',
  ]);
  const artifactBytes = Buffer.from(JSON.stringify(payload));
  return {
    envelope: Object.assign({
      schemaVersion: 2,
      providerKey: 'antifilter',
      datasetVersion: 'test-only',
      generatedAt: '2026-10-29T00:00:00.000Z',
      sourceRevisions: [{sourceId: 'synthetic-test-only', revision: 'fixture'}],
      ruleCount: payload.ruleCount,
      artifactByteCount: artifactBytes.length,
      artifactSha256: sha256(artifactBytes),
      routeTableVersion: 1,
    }, options.envelope),
    artifactBytes,
    trust: options.trust || Dataset.TRUST.PACKAGED_TRUSTED,
    sha256,
  };
}

module.exports = {Codec, Dataset, sha256, compactArtifact};
