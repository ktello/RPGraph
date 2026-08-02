import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const childEnvironment = { ...process.env };

// Electron-based terminals and IDEs can leak this variable into child
// processes. It makes the Electron executable behave like plain Node.js,
// which means APIs such as app and BrowserWindow are unavailable.
delete childEnvironment.ELECTRON_RUN_AS_NODE;

const electron = spawn(electronPath, ['.', ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: childEnvironment,
  stdio: 'inherit',
});

const forwardedSignals = ['SIGINT', 'SIGTERM'];
const forwardSignal = (signal) => {
  if (!electron.killed) {
    electron.kill(signal);
  }
};

for (const signal of forwardedSignals) {
  process.on(signal, () => forwardSignal(signal));
}

electron.once('error', (error) => {
  console.error(`Failed to start Electron: ${error.message}`);
  process.exitCode = 1;
});

electron.once('exit', (code, signal) => {
  if (code !== null) {
    process.exitCode = code;
    return;
  }

  process.exitCode = signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1;
});
