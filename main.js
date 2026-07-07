'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const { parseLine } = require('./parser');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// No port check – just a short delay to let the daemon start
const DAEMON_START_DELAY = 3000; // 3 seconds

let mainWindow = null;
let minerProcess = null;
let daemonProcess = null;
let gpuPollTimer = null;
let inferWindow = null;
let minerRunning = false;

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// ---------------------------------------------------------------------------
// Helper to find bundled binaries (works in development and production)
// ---------------------------------------------------------------------------

function getDefaultBinaryPath() {
  const candidates = [
    path.join(process.resourcesPath, 'bin', 'keryx-miner.exe'),
    path.join(__dirname, 'bin', 'keryx-miner.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getDefaultDaemonPath() {
  const candidates = [
    path.join(process.resourcesPath, 'bin', 'keryxd.exe'),
    path.join(__dirname, 'bin', 'keryxd.exe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Daemon process – visible window
// ---------------------------------------------------------------------------

function startDaemon(daemonPath) {
  if (daemonProcess) return false;

  if (!fs.existsSync(daemonPath)) {
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'warn',
      text: `keryxd.exe not found at ${daemonPath} – mining may fail`
    });
    return false;
  }

  daemonProcess = spawn(daemonPath, [], {
    cwd: path.dirname(daemonPath),
    detached: false,
  });

  // Daemon logs go to the dashboard (will be routed to daemon log box)
  daemonProcess.stdout.on('data', (data) => {
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'info',
      text: `[keryxd] ${data.toString().trim()}`
    });
  });
  daemonProcess.stderr.on('data', (data) => {
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'error',
      text: `[keryxd] ${data.toString().trim()}`
    });
  });

  daemonProcess.on('error', (err) => {
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'error',
      text: `Failed to start keryxd: ${err.message}`
    });
    daemonProcess = null;
  });

  daemonProcess.on('exit', (code, signal) => {
    daemonProcess = null;
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'info',
      text: `keryxd process exited (code: ${code}, signal: ${signal})`
    });
  });

  sendToRenderer('miner-event', {
    type: 'log',
    level: 'info',
    text: `keryxd started (PID: ${daemonProcess.pid})`
  });
  return true;
}

function stopDaemon() {
  if (daemonProcess) {
    daemonProcess.kill();
    daemonProcess = null;
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'info',
      text: 'keryxd stopped'
    });
  }
}

// ---------------------------------------------------------------------------
// Miner process – visible window
// ---------------------------------------------------------------------------

function startMiner(config) {
  stopMiner();

  if (!config || !config.minerPath || !fs.existsSync(config.minerPath)) {
    minerRunning = false;
    sendToRenderer('miner-status', { running: false, error: 'miner binary not found' });
    return;
  }

  // --- Determine daemon path ---
  // First try the default bundled location, then fallback to same folder as miner
  let daemonPath = getDefaultDaemonPath();
  if (!daemonPath) {
    const fallbackDaemonPath = path.join(path.dirname(config.minerPath), 'keryxd.exe');
    if (fs.existsSync(fallbackDaemonPath)) {
      daemonPath = fallbackDaemonPath;
    }
  }
  if (!daemonPath) {
    sendToRenderer('miner-event', {
      type: 'log',
      level: 'error',
      text: 'Could not find keryxd.exe – please ensure it is in the bin/ folder.'
    });
    return;
  }

  const started = startDaemon(daemonPath);
  if (!started) return;

  // Wait a moment for daemon to start listening, then launch miner
  setTimeout(() => {
    if (minerRunning) return; // already stopped

    const args = [
      '--mining-address', config.miningAddress,
      ...(config.keryxdAddress ? ['--keryxd-address', config.keryxdAddress] : []),
      ...(config.tier && config.tier !== 'default' ? [`--${config.tier}`] : []),
      ...(config.extraArgs || []),
    ];

    minerRunning = true;
    sendToRenderer('miner-status', { running: true, mode: 'live', binary: config.minerPath });

    minerProcess = spawn(config.minerPath, args, {
      cwd: path.dirname(config.minerPath),
    });

    const attach = (stream) => {
      const rl = readline.createInterface({ input: stream });
      rl.on('line', (line) => {
        for (const event of parseLine(line)) {
          sendToRenderer('miner-event', event);
        }
      });
    };
    attach(minerProcess.stdout);
    attach(minerProcess.stderr);

    minerProcess.on('exit', (code, signal) => {
      minerRunning = false;
      sendToRenderer('miner-status', { running: false, exitCode: code, signal });
      minerProcess = null;
      stopDaemon();
    });

    minerProcess.on('error', (err) => {
      minerRunning = false;
      sendToRenderer('miner-event', { type: 'log', level: 'error', text: `Failed to launch miner: ${err.message}` });
      sendToRenderer('miner-status', { running: false, error: err.message });
      stopDaemon();
    });
  }, DAEMON_START_DELAY);
}

function stopMiner() {
  if (minerProcess) {
    minerProcess.kill();
    minerProcess = null;
  }
  stopDaemon();
  minerRunning = false;
}

// ---------------------------------------------------------------------------
// GPU stats
// ---------------------------------------------------------------------------

function startGpuPolling() {
  stopGpuPolling();
  gpuPollTimer = setInterval(() => {
    exec(
      'nvidia-smi --query-gpu=temperature.gpu,power.draw,memory.used,memory.total --format=csv,noheader,nounits',
      (err, stdout) => {
        if (err) return;
        const [tempStr, powerStr, memUsedStr, memTotalStr] = stdout.trim().split(',').map(s => s.trim());
        const temp = parseFloat(tempStr);
        const power = parseFloat(powerStr);
        const vramUsed = parseFloat(memUsedStr);
        const vramTotal = parseFloat(memTotalStr);
        if (!Number.isNaN(temp) && !Number.isNaN(power) && !Number.isNaN(vramUsed) && !Number.isNaN(vramTotal)) {
          sendToRenderer('miner-event', { type: 'gpu-stats', temp, power, vramUsed, vramTotal });
        }
      }
    );
  }, 2000);
}

function stopGpuPolling() {
  if (gpuPollTimer) clearInterval(gpuPollTimer);
  gpuPollTimer = null;
}

// ---------------------------------------------------------------------------
// Explorer scraper – removed
// ---------------------------------------------------------------------------
function startExplorerScraper() {}
function stopExplorerScraper() {}

// ---------------------------------------------------------------------------
// Boot & lifecycle
// ---------------------------------------------------------------------------

function boot() {
  const config = loadConfig();
  startGpuPolling();
  startExplorerScraper();

  let finalConfig = config || {};
  if (!finalConfig.minerPath || !fs.existsSync(finalConfig.minerPath)) {
    const bundled = getDefaultBinaryPath();
    if (bundled) {
      finalConfig.minerPath = bundled;
      saveConfig(finalConfig);
    }
  }

  if (finalConfig.minerPath && fs.existsSync(finalConfig.minerPath)) {
    startMiner(finalConfig);
  } else {
    minerRunning = false;
    sendToRenderer('miner-status', { running: false, error: 'miner binary not found' });
    // No automatic settings popup
  }
}

function shutdownAll() {
  stopMiner();
  stopGpuPolling();
  stopExplorerScraper();
}

function createInferWindow() {
  if (inferWindow && !inferWindow.isDestroyed()) {
    inferWindow.focus();
    return;
  }
  inferWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  inferWindow.loadURL('https://keryx-labs.com/infer');
  inferWindow.on('closed', () => {
    inferWindow = null;
  });
}

ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('save-config', (_evt, config) => {
  saveConfig(config);
  shutdownAll();
  startGpuPolling();
  startExplorerScraper();
  if (config.minerPath && fs.existsSync(config.minerPath)) {
    startMiner(config);
  } else {
    minerRunning = false;
    sendToRenderer('miner-status', { running: false });
  }
  return true;
});
ipcMain.handle('window-min', () => mainWindow && mainWindow.minimize());
ipcMain.handle('window-close', () => mainWindow && mainWindow.close());
ipcMain.handle('open-infer-window', () => createInferWindow());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#000000',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    const config = loadConfig();
    const running = minerRunning;
    const binary = (running && config && config.minerPath) ? config.minerPath : undefined;
    sendToRenderer('miner-status', { running, binary });
  });
}

app.whenReady().then(() => {
  createWindow();
  boot();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  shutdownAll();
  if (process.platform !== 'darwin') app.quit();
});