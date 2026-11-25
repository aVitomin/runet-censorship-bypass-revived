import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

import {
  inlineMarkdownLinkPattern,
  stripHtmlTags,
} from './verify-docs-parser.mjs';

test('inline Markdown links retain supported escaping and nested parentheses', () => {
  const source = String.raw`[one](docs/a\ file.md) [two](docs/(nested).md "title")`;
  const matches = [...source.matchAll(inlineMarkdownLinkPattern)];

  assert.deepEqual(matches.map((match) => match[2] ?? match[3]), [
    String.raw`docs/a\ file.md`,
    'docs/(nested).md',
  ]);
});

test('inline Markdown link matching handles a long unmatched escape sequence', () => {
  const source = `[label](${String.raw`\!`.repeat(20_000)}`;

  assert.deepEqual([...source.matchAll(inlineMarkdownLinkPattern)], []);
});

test('documentation preflight checks a renamed guide and new files without staging', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rucb-docs-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (name, text) => fs.writeFileSync(path.join(root, name), text);
  const git = (...args) => execFileSync('git', args, {cwd: root});
  fs.mkdirSync(path.join(root, 'scripts'));
  for (const file of ['verify-docs.mjs', 'verify-docs-parser.mjs']) {
    fs.copyFileSync(new URL(file, import.meta.url), path.join(root, 'scripts', file));
  }
  git('init', '--quiet');
  write('.gitignore', '.local/\n');
  write('old.md', '# Guide');
  write('removed.md', '# Removed');
  git('add', '--', '.');
  const index = git('ls-files', '--stage', '-z');
  fs.renameSync(path.join(root, 'old.md'), path.join(root, 'new guide.md'));
  fs.unlinkSync(path.join(root, 'removed.md'));
  // The fixture has no product release docs. Their baseline diagnostics stay the same.
  function findings() {
    const result = spawnSync(process.execPath, ['scripts/verify-docs.mjs'], {cwd: root, encoding: 'utf8'});
    assert.match(result.stderr, /Documentation integrity failed/u);
    return result.stderr.split(/\r?\n/u).filter((line) => line.startsWith('- '));
  }
  const baseline = findings();
  fs.mkdirSync(path.join(root, '.local'));
  write('.local/private.md', '[missing](ignored-target.md)');
  write('report.md', '[old](old.md) and [missing](missing.md)');
  assert.deepEqual(findings(), [
    ...baseline,
    '- report.md:1: old.md — relative target does not exist',
    '- report.md:1: missing.md — relative target does not exist',
  ]);
  write('report.md', '[guide](<new guide.md>#guide)');
  assert.deepEqual(findings(), baseline);
  assert.deepEqual(git('ls-files', '--stage', '-z'), index);
});

test('HTML tag stripping cannot recreate a nested tag sequence', () => {
  assert.equal(stripHtmlTags('<scr<script>ipt>alert</script>'), 'ipt>alert');
  assert.equal(stripHtmlTags('before <em>inside</em> after'), 'before inside after');
});
