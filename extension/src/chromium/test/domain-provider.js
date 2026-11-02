'use strict';

const Assert = require('node:assert');
const {Codec, Dataset, compactArtifact} =
  require('../../tooling/test-support/domain-dataset');

describe('Compact domain dataset verification', function() {
  it('verifies a separate immutable exact-host schema without changing legacy limits',
      async function() {
        const result = await Dataset.verifyProviderDataset(compactArtifact());
        Assert.strictEqual(result.ok, true, result.code);
        Assert.strictEqual(result.dataset.envelope.schemaVersion, 2);
        Assert.strictEqual(Dataset.SCHEMA_VERSION, 1);
        Assert.strictEqual(Dataset.LIMITS.MAX_RULES, 750000);
        Assert.throws(() => result.dataset.payload.blocks.push('bad'), TypeError);
        Assert.throws(() => result.dataset.payload.policy = 'DOMAIN_AND_SUBDOMAINS', TypeError);
      });

  it('binds format, provider, matching policy, counts and hashes', async function() {
    const cases = [
      [{envelope: {schemaVersion: 1}}, 'PROVIDER_SCHEMA_MISMATCH'],
      [{envelope: {providerKey: 'anticensority'}}, 'PROVIDER_SCHEMA_MISMATCH'],
      [{envelope: {schemaVersion: 99}}, 'UNSUPPORTED_SCHEMA_VERSION'],
      [{envelope: {ruleCount: 2000001}}, 'TOO_MANY_RULES'],
      [{envelope: {ruleCount: 4}}, 'RULE_COUNT_MISMATCH'],
      [{envelope: {artifactSha256: '0'.repeat(64)}}, 'ARTIFACT_SHA256_MISMATCH'],
      [{payload: Codec.encode(['blocked.example'], {policy: 'DOMAIN_AND_SUBDOMAINS'})},
        'INVALID_COMPACT_MATCH_POLICY'],
      [{payload: {format: 'HOST_BUCKETS_V1', buckets: [], ruleCount: 1}},
        'INVALID_COMPACT_MATCH_POLICY'],
    ];
    for (const [options, expected] of cases) {
      const result = await Dataset.verifyProviderDataset(compactArtifact(options));
      Assert.strictEqual(result.ok, false, expected);
      Assert.strictEqual(result.code, expected);
    }
    const corrupt = compactArtifact();
    corrupt.artifactBytes[0] = 0;
    Assert.strictEqual((await Dataset.verifyProviderDataset(corrupt)).code,
        'ARTIFACT_SHA256_MISMATCH');
  });

  it('keeps untrusted input inactive even when its data is valid', async function() {
    const result = await Dataset.verifyProviderDataset(compactArtifact({
      trust: Dataset.TRUST.REMOTE_UNAUTHENTICATED,
    }));
    Assert.strictEqual(result.ok, true);
    Assert.strictEqual(result.activationEligible, false);
  });
});
