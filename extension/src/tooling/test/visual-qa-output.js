'use strict';

const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Os = require('node:os');
const Path = require('node:path');
const {createVisualRunDirectory} = require('../visual-qa-output');

describe('visual QA run directories', function() {
  let fixture;
  let repo;
  let base;

  beforeEach(function() {
    fixture = Fs.mkdtempSync(Path.join(Fs.realpathSync.native(Os.tmpdir()), 'rucb-visual-test-'));
    repo = Path.join(fixture, 'repo');
    Fs.mkdirSync(repo);
    base = Path.join(repo, '.local', 'cross-browser-visual-qa');
  });

  afterEach(function() {
    Fs.rmSync(fixture, {recursive: true, force: true});
  });

  it('creates a fresh directory per run and preserves old reports, images and siblings', function() {
    const first = createVisualRunDirectory(repo);
    Assert.equal(Path.dirname(first), base);
    const oldReport = Path.join(base, 'report.json');
    const firstImage = Path.join(first, 'popup.png');
    Fs.writeFileSync(oldReport, 'original report');
    Fs.writeFileSync(firstImage, 'original image');
    const second = createVisualRunDirectory(repo, base);
    Assert.equal(Path.dirname(second), base);
    Assert.notEqual(first, second);
    Assert.deepEqual(Fs.readdirSync(second), []);
    Assert.equal(Fs.readFileSync(oldReport, 'utf8'), 'original report');
    Assert.equal(Fs.readFileSync(firstImage, 'utf8'), 'original image');
    const group = Path.join(base, 'store', 'firefox');
    Assert.equal(Path.dirname(createVisualRunDirectory(repo, group)), group);
  });

  it('refuses unrelated parents before creating the output tree', function() {
    const unrelated = Path.join(repo, '.local', 'other');
    Fs.mkdirSync(unrelated, {recursive: true});
    const keep = Path.join(unrelated, 'keep.txt');
    Fs.writeFileSync(keep, 'keep');
    for (const parent of [repo, Path.dirname(base), unrelated, base + '-other',
      Path.join(base, '..', 'other'), fixture]) {
      Assert.throws(() => createVisualRunDirectory(repo, parent), /must stay inside/);
    }
    Assert.equal(Fs.existsSync(base), false);
    Assert.deepEqual(Fs.readdirSync(unrelated), ['keep.txt']);
    Assert.equal(Fs.readFileSync(keep, 'utf8'), 'keep');
  });

  for (const depth of ['local', 'base', 'group']) {
    it(`refuses a redirected ${depth} directory without writing through it`, function() {
      const outside = Path.join(fixture, 'outside');
      Fs.mkdirSync(outside);
      Fs.writeFileSync(Path.join(outside, 'keep.txt'), 'keep');
      const link = {local: Path.dirname(base), base, group: Path.join(base, 'store')}[depth];
      Fs.mkdirSync(Path.dirname(link), {recursive: true});
      Fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
      Assert.throws(() => createVisualRunDirectory(repo, Path.join(base, 'store', 'new')));
      Assert.deepEqual(Fs.readdirSync(outside), ['keep.txt']);
      Assert.equal(Fs.readFileSync(Path.join(outside, 'keep.txt'), 'utf8'), 'keep');
    });
  }

  it('preserves a file selected as the output parent', function() {
    Fs.mkdirSync(base, {recursive: true});
    const file = Path.join(base, 'notes');
    Fs.writeFileSync(file, 'keep');
    Assert.throws(() => createVisualRunDirectory(repo, file));
    Assert.equal(Fs.readFileSync(file, 'utf8'), 'keep');
  });
});
