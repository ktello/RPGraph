import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockfilePath = resolve(projectRoot, 'package-lock.json');
const statePath = resolve(projectRoot, 'node_modules', '.rpgraph-install-state.json');
const require = createRequire(import.meta.url);

const lockfileHash = () =>
  createHash('sha256').update(readFileSync(lockfilePath)).digest('hex');

const electronIsInstalled = () => {
  try {
    const electronPath = require('electron');
    return typeof electronPath === 'string' && existsSync(electronPath);
  } catch {
    return false;
  }
};

const currentState = () => ({
  lockfileHash: lockfileHash(),
  platform: process.platform,
  architecture: process.arch,
});

const installedDependenciesAreCurrent = () => {
  if (!electronIsInstalled()) {
    return false;
  }

  try {
    const installedState = JSON.parse(readFileSync(statePath, 'utf8'));
    const expectedState = currentState();
    return (
      installedState.lockfileHash === expectedState.lockfileHash &&
      installedState.platform === expectedState.platform &&
      installedState.architecture === expectedState.architecture
    );
  } catch {
    return false;
  }
};

const command = process.argv[2];

if (command === 'check') {
  process.exitCode = installedDependenciesAreCurrent() ? 0 : 1;
} else if (command === 'record') {
  if (!electronIsInstalled()) {
    console.error('Electron is missing or incomplete after npm ci.');
    process.exitCode = 1;
  } else {
    writeFileSync(statePath, `${JSON.stringify(currentState(), null, 2)}\n`);
  }
} else {
  console.error('Usage: node scripts/dependency-state.mjs <check|record>');
  process.exitCode = 2;
}
