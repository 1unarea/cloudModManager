#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const VERSION = 'v0.2.0';
const REPO = '1unarea/cloudModManager';

function getPlatformInfo() {
  const platform = os.platform();
  const arch = os.arch();

  let goos = '';
  let ext = '';
  if (platform === 'linux') goos = 'linux';
  else if (platform === 'darwin') goos = 'darwin';
  else if (platform === 'win32') { goos = 'windows'; ext = '.exe'; }
  else throw new Error(`Unsupported OS: ${platform}`);

  let goarch = '';
  if (arch === 'x64') goarch = 'amd64';
  else if (arch === 'arm64') goarch = 'arm64';
  else throw new Error(`Unsupported architecture: ${arch}`);

  return { goos, goarch, ext };
}

function downloadBinary(callback) {
  const { goos, goarch, ext } = getPlatformInfo();
  const binaryName = `cmm-${VERSION}-${goos}-${goarch}${ext}`;
  const targetDir = path.join(__dirname, 'bin');
  const targetFile = path.join(targetDir, `cmm${ext}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const url = `https://github.com/${REPO}/releases/download/${VERSION}/${binaryName}`;

  function download(urlRedirect) {
    https.get(urlRedirect, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location);
        return;
      }
      if (res.statusCode !== 200) {
        if (callback) callback(new Error(`HTTP status ${res.statusCode}`));
        return;
      }
      const tmpFile = `${targetFile}.tmp`;
      const file = fs.createWriteStream(tmpFile);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.chmodSync(tmpFile, 0o755);
          fs.renameSync(tmpFile, targetFile);
          if (callback) callback(null, targetFile);
        });
      });
    }).on('error', (err) => {
      if (callback) callback(err);
    });
  }

  download(url);
}

module.exports = { downloadBinary, getPlatformInfo };

if (require.main === module) {
  try {
    downloadBinary((err) => {
      if (err) {
        console.warn(`[WARN] Pre-install binary download failed: ${err.message}. Binary will be fetched when run.`);
      } else {
        console.log(`[OK] Cloud Mod Manager binary prepared.`);
      }
    });
  } catch (err) {
    console.warn(`[WARN] ${err.message}`);
  }
}
