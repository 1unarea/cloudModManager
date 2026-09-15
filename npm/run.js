#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { downloadBinary } = require('./install.js');

const ext = os.platform() === 'win32' ? '.exe' : '';
const binPath = path.join(__dirname, 'bin', `cmm${ext}`);

function execute() {
  const result = spawnSync(binPath, process.argv.slice(2), {
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`[ERROR] Failed to run cmm: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

if (!fs.existsSync(binPath)) {
  console.log('[INFO] Cloud Mod Manager binary not found locally. Downloading...');
  downloadBinary((err, target) => {
    if (err) {
      console.error(`[ERROR] Failed to download cmm binary: ${err.message}`);
      process.exit(1);
    }
    execute();
  });
} else {
  execute();
}
