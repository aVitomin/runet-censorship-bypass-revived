'use strict';

const Fs = require('node:fs');
const Path = require('node:path');

function createVisualRunDirectory(repositoryRoot, outputParent) {

  const base = Path.join(repositoryRoot, '.local', 'cross-browser-visual-qa');
  const relative = Path.relative(base, outputParent || base);
  if (relative === '..' || relative.startsWith(`..${Path.sep}`) || Path.isAbsolute(relative)) {
    throw new Error(`Visual QA output must stay inside ${base}.`);
  }

  // Check each parent before creating anything below it, including on a fresh checkout.
  let directory = Fs.realpathSync.native(repositoryRoot);
  const groups = relative ? relative.split(Path.sep) : [];
  for (const part of ['.local', 'cross-browser-visual-qa', ...groups]) {
    directory = Path.join(directory, part);
    try {
      Fs.mkdirSync(directory);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    if (!Fs.lstatSync(directory).isDirectory() ||
        Path.relative(directory, Fs.realpathSync.native(directory)) !== '') {
      throw new Error(`Visual QA output requires an ordinary directory: ${directory}`);
    }
  }
  return Fs.mkdtempSync(Path.join(directory, 'run-'));

}

module.exports = {createVisualRunDirectory};
