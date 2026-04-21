//=================================================================
// CRYSTAL SYSTEM.JS v1.0.2
// Advanced Cross-Platform System Monitor
// Developed by Crystal Studio Labs
// Author: SahooShuvranshu
// https://github.com/Crystal-Studio-Labs/crystalsystem.js
//=================================================================

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const http = require('http');

// ─── ANSI Colors ────────────────────────────────────────────────
const colors = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  bgBlue:  '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed:   '\x1b[41m',
  bgCyan:  '\x1b[46m',
};
const c = (text, col) => `${colors[col] || ''}${text}${colors.reset}`;

// ─── Utilities ──────────────────────────────────────────────────
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatPercent(value, total, decimals = 2) {
  if (!total) return '0.00%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function padEnd(str, len) {
  // Strip ANSI escape codes for length calculation
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const pad = Math.max(0, len - stripped.length);
  return str + ' '.repeat(pad);
}

// ─── Sparkline ──────────────────────────────────────────────────
const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(history, maxWidth = 20) {
  if (!history.length) return '';
  const slice = history.slice(-maxWidth);
  const min = Math.min(...slice);
  const max = Math.max(...slice);
  const range = max - min || 1;
  return slice.map(v => {
    const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1));
    const pct = v;
    const col = pct > 80 ? 'red' : pct > 50 ? 'yellow' : 'green';
    return c(SPARK_CHARS[idx], col);
  }).join('');
}

// ─── CPU Sampling (real %) ───────────────────────────────────────
let _lastCpuSample = null;

function sampleCPURaw() {
  return os.cpus().map(cpu => ({
    idle: cpu.times.idle,
    total: Object.values(cpu.times).reduce((a, b) => a + b, 0),
  }));
}

function getCPUPercent() {
  const current = sampleCPURaw();
  if (!_lastCpuSample) {
    _lastCpuSample = current;
    return 0;
  }
  let totalIdle = 0, totalTick = 0;
  for (let i = 0; i < current.length; i++) {
    totalIdle += current[i].idle - (_lastCpuSample[i]?.idle || 0);
    totalTick += current[i].total - (_lastCpuSample[i]?.total || 0);
  }
  _lastCpuSample = current;
  return totalTick === 0 ? 0 : parseFloat((100 - (100 * totalIdle / totalTick)).toFixed(2));
}

function getCPUInfo() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuPercent = getCPUPercent();

  // Termux/Android may return empty cpus array — fallback gracefully
  let coreCount = cpus.length;
  if (coreCount === 0) {
    try {
      const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      const matches = cpuinfo.match(/^processor\s*:/gm);
      coreCount = matches ? matches.length : 1;
    } catch { coreCount = 1; }
  }

  let model = cpus[0]?.model || 'Unknown';
  let speed = cpus[0]?.speed || 0;
  if (model === 'Unknown' || !speed) {
    try {
      const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      const hw = cpuinfo.match(/^Hardware\s*:\s*(.+)$/m);
      const mhz = cpuinfo.match(/^cpu MHz\s*:\s*([\d.]+)/m);
      if (hw) model = hw[1].trim();
      if (mhz) speed = Math.round(parseFloat(mhz[1]));
    } catch {}
  }

  return {
    model,
    speed: `${speed} MHz`,
    cores: coreCount,
    threads: coreCount,
    loadAvg: loadAvg.map(l => l.toFixed(2)).join(' / '),
    loadPercent: `${cpuPercent}%`,
    loadRaw: cpuPercent,
    arch: os.arch(),
    endianness: os.endianness(),
  };
}

// ─── Platform ───────────────────────────────────────────────────
function getPlatformInfo() {
  const platform = os.platform();
  const names = {
    win32: 'Windows', darwin: 'macOS', linux: 'Linux',
    android: 'Android', freebsd: 'FreeBSD', openbsd: 'OpenBSD', sunos: 'Solaris',
  };
  return {
    platform,
    platformName: names[platform] || platform,
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
  };
}

// ─── Memory ─────────────────────────────────────────────────────
function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total: formatBytes(total),
    free: formatBytes(free),
    used: `${formatBytes(used)} (${formatPercent(used, total)})`,
    percent: formatPercent(used, total),
    usedRaw: used,
    totalRaw: total,
    usedPercent: parseFloat(((used / total) * 100).toFixed(2)),
  };
}

// ─── Network ────────────────────────────────────────────────────
let _lastNetSample = { rx: 0, tx: 0, ts: Date.now() };

function readProcNetDev() {
  try {
    const raw = fs.readFileSync('/proc/net/dev', 'utf8');
    let rx = 0, tx = 0;
    for (const line of raw.split('\n').slice(2)) {
      if (!line.trim()) continue;
      const [, stats] = line.split(':');
      if (!stats) continue;
      const parts = stats.trim().split(/\s+/).map(Number);
      rx += parts[0] || 0;
      tx += parts[8] || 0;
    }
    return { rx, tx };
  } catch { return null; }
}

function getNetworkInfo() {
  const ifaces = os.networkInterfaces();
  const networkList = [];
  let totalRx = 0, totalTx = 0;

  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const iface of addrs) {
      if (iface.internal) continue;
      networkList.push({ name, address: iface.address, family: iface.family, mac: iface.mac });
    }
  }

  const proc = readProcNetDev();
  if (proc) { totalRx = proc.rx; totalTx = proc.tx; }

  const now = Date.now();
  const elapsed = (now - _lastNetSample.ts) / 1000 || 1;
  const rxSpeed = Math.max(0, (totalRx - _lastNetSample.rx) / elapsed);
  const txSpeed = Math.max(0, (totalTx - _lastNetSample.tx) / elapsed);
  _lastNetSample = { rx: totalRx, tx: totalTx, ts: now };

  return {
    inbound: formatBytes(totalRx),
    outbound: formatBytes(totalTx),
    rxSpeed: `${formatBytes(rxSpeed)}/s`,
    txSpeed: `${formatBytes(txSpeed)}/s`,
    rxSpeedRaw: rxSpeed,
    txSpeedRaw: txSpeed,
    interfaces: networkList,
  };
}

// ─── Disk ────────────────────────────────────────────────────────
function getDiskInfo() {
  const info = { partitions: [], total: 'N/A', used: 'N/A', free: 'N/A' };
  try {
    const stat = fs.statfsSync('/');
    const bs = stat.bsize || 4096;
    const total = stat.blocks * bs;
    const free = stat.bfree * bs;
    const used = total - free;
    info.total = formatBytes(total);
    info.used = `${formatBytes(used)} (${formatPercent(used, total)})`;
    info.free = formatBytes(free);
    info.usedPercent = parseFloat(((used / total) * 100).toFixed(2));
    info.partitions.push({ mountpoint: '/', total: info.total, used: info.used, free: info.free });
  } catch {}
  return info;
}

// ─── Battery ─────────────────────────────────────────────────────
function getBatteryInfo() {
  const bat = { supported: false, level: 'N/A', charging: 'N/A', timeRemaining: 'N/A' };
  try {
    for (const p of ['/sys/class/power_supply/BAT0', '/sys/class/power_supply/battery']) {
      if (!fs.existsSync(p)) continue;
      bat.supported = true;
      try { bat.level = `${fs.readFileSync(`${p}/capacity`, 'utf8').trim()}%`; } catch {}
      try {
        const status = fs.readFileSync(`${p}/status`, 'utf8').trim();
        bat.charging = status === 'Charging' ? 'Yes' : 'No';
      } catch {}
      break;
    }
    if (!bat.supported && os.platform() === 'darwin') {
      const { execSync } = require('child_process');
      const pmset = execSync('pmset -g batt 2>/dev/null', { encoding: 'utf8' });
      const match = pmset.match(/(\d+)%/);
      if (match) {
        bat.supported = true;
        bat.level = `${match[1]}%`;
        bat.charging = pmset.includes('charging') ? 'Yes' : 'No';
      }
    }
  } catch {}
  return bat;
}

// ─── GPU ─────────────────────────────────────────────────────────
function getGPUInfo() {
  const gpu = { model: 'N/A', driver: 'N/A', memory: 'N/A' };
  try {
    if (['linux', 'android'].includes(os.platform())) {
      try {
        const { execSync } = require('child_process');
        const out = execSync('lspci 2>/dev/null | grep -i "vga\\|3d\\|display"', { encoding: 'utf8' });
        if (out.trim()) gpu.model = out.split('\n')[0].split(':').slice(1).join(':').trim().substring(0, 60);
      } catch {}
      if (gpu.model === 'N/A') {
        try {
          const drmPath = '/sys/class/drm';
          if (fs.existsSync(drmPath)) {
            for (const card of fs.readdirSync(drmPath)) {
              if (!card.startsWith('card')) continue;
              const vp = path.join(drmPath, card, 'device/vendor');
              if (fs.existsSync(vp)) {
                gpu.model = `GPU (Vendor: ${fs.readFileSync(vp, 'utf8').trim()})`;
                break;
              }
            }
          }
        } catch {}
      }
    }
    if (os.platform() === 'darwin') {
      try {
        const { execSync } = require('child_process');
        const out = execSync('system_profiler SPDisplaysDataType 2>/dev/null | grep "Chipset Model"', { encoding: 'utf8' });
        if (out) gpu.model = out.split(':')[1]?.trim() || 'N/A';
      } catch {}
    }
  } catch {}
  return gpu;
}

// ─── Process Info ────────────────────────────────────────────────
function getProcessInfo() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: formatUptime(process.uptime()),
    heapUsed: formatBytes(mem.heapUsed),
    heapTotal: formatBytes(mem.heapTotal),
    rss: formatBytes(mem.rss),
    external: formatBytes(mem.external),
  };
}

// ─── Top Processes ───────────────────────────────────────────────
function getTopProcesses(limit = 5) {
  const list = [];
  try {
    if (['linux', 'android'].includes(os.platform())) {
      const { execSync } = require('child_process');
      const out = execSync('ps aux --sort=-%mem 2>/dev/null | head -6', { encoding: 'utf8' });
      const lines = out.trim().split('\n').slice(1);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        list.push({
          pid: parts[1],
          cpu: `${parts[2]}%`,
          mem: `${parts[3]}%`,
          name: parts.slice(10).join(' ').substring(0, 30),
        });
      }
    }
  } catch {}
  return list.slice(0, limit);
}

// ─── Full Stats Object ───────────────────────────────────────────
function getAllStats(options = {}) {
  const { showNetwork = true, showDisk = true, showBattery = true, showGPU = true, showProcesses = true } = options;
  return {
    timestamp: new Date().toISOString(),
    platform: getPlatformInfo(),
    cpu: getCPUInfo(),
    memory: getMemoryInfo(),
    network: showNetwork ? getNetworkInfo() : undefined,
    disk: showDisk ? getDiskInfo() : undefined,
    battery: showBattery ? getBatteryInfo() : undefined,
    gpu: showGPU ? getGPUInfo() : undefined,
    process: getProcessInfo(),
    topProcesses: showProcesses ? getTopProcesses() : undefined,
  };
}

// ─── Table Builder ───────────────────────────────────────────────
const W = 60; // box inner width

function box(label, rows, showColors) {
  const cc = (text, col) => showColors ? c(text, col) : text;
  const W2 = W - 2;
  const top    = cc(`┌─ ${label} ${'─'.repeat(Math.max(0, W2 - label.length - 3))}┐`, 'cyan');
  const bottom = cc(`└${'─'.repeat(W2)}┘`, 'cyan');
  let out = top + '\n';
  for (const [lbl, val, valColor] of rows) {
    const labelStr = cc(`│ ${lbl}`, 'cyan');
    const valueStr = showColors && valColor ? cc(String(val), valColor) : String(val);
    const rowContent = `${labelStr.replace(/\x1b\[[0-9;]*m/g, '')} ${String(val)}`;
    const visLen = rowContent.length;
    const padding = Math.max(0, W2 - visLen + 1);
    const rawRow = `${labelStr} ${valueStr}${' '.repeat(padding)}`;
    out += rawRow + cc('│', 'cyan') + '\n';
  }
  out += bottom + '\n';
  return out;
}

function buildBar(percent, width = 20, showColors = true) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const col = percent > 80 ? 'red' : percent > 50 ? 'yellow' : 'green';
  const bar = '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
  return showColors ? `${c(bar, col)} ${percent}%` : `${bar} ${percent}%`;
}

function buildSystemTable(options = {}) {
  const {
    showColors = true, showNetwork = true, showDisk = true,
    showBattery = true, showGPU = true, showProcesses = true,
    cpuHistory = [], memHistory = [],
  } = options;

  const platform = getPlatformInfo();
  const cpu = getCPUInfo();
  const memory = getMemoryInfo();
  const network = showNetwork ? getNetworkInfo() : null;
  const disk = showDisk ? getDiskInfo() : null;
  const battery = showBattery ? getBatteryInfo() : null;
  const gpu = showGPU ? getGPUInfo() : null;
  const proc = getProcessInfo();
  const topProcs = showProcesses ? getTopProcesses() : [];

  const cc = (text, col) => showColors ? c(text, col) : text;

  let out = '\n';

  // ── Header ──
  const border = '═'.repeat(W);
  out += cc(border, 'blue') + '\n';
  const title = '  CRYSTAL SYSTEM.JS v1.0.2  ';
  const sub   = '  Crystal Studio Labs  ';
  out += cc('█', 'blue') + ' ' + cc(title, 'bgBlue') + cc(sub, 'bgCyan') + ' ' + cc('█', 'blue') + '\n';
  out += cc(border, 'blue') + '\n\n';

  // ── Platform ──
  out += box('PLATFORM', [
    ['OS      ', `${platform.platformName} ${platform.release} (${platform.arch})`],
    ['Hostname', platform.hostname],
    ['Uptime  ', formatUptime(os.uptime())],
    ['Node.js ', proc.nodeVersion],
  ], showColors);

  // ── CPU ──
  const cpuBar = buildBar(cpu.loadRaw, 20, showColors);
  const cpuSpark = cpuHistory.length ? sparkline(cpuHistory, 18) : '';
  out += box('CPU', [
    ['Model   ', cpu.model.substring(0, 44)],
    ['Speed   ', cpu.speed],
    ['Cores   ', `${cpu.cores} threads  │  Arch: ${cpu.arch}`],
    ['Load Avg', cpu.loadAvg],
    ['Usage   ', `${cpuBar}  ${cpuSpark}`],
  ], showColors);

  // ── Memory ──
  const memPct = memory.usedPercent;
  const memBar = buildBar(memPct, 20, showColors);
  const memSpark = memHistory.length ? sparkline(memHistory, 18) : '';
  out += box('MEMORY', [
    ['Total   ', memory.total],
    ['Used    ', memory.used],
    ['Free    ', memory.free],
    ['Usage   ', `${memBar}  ${memSpark}`],
    ['Heap    ', `${proc.heapUsed} / ${proc.heapTotal}  (RSS: ${proc.rss})`],
  ], showColors);

  // ── Network ──
  if (showNetwork && network) {
    const rows = [
      ['Total ↓ ', network.inbound],
      ['Total ↑ ', network.outbound],
      ['Speed ↓ ', network.rxSpeed],
      ['Speed ↑ ', network.txSpeed],
    ];
    if (network.interfaces.length) {
      rows.push(['Ifaces  ', network.interfaces.slice(0, 3).map(i => `${i.name}(${i.address})`).join(', ').substring(0, 44)]);
    }
    out += box('NETWORK', rows, showColors);
  }

  // ── Disk ──
  if (showDisk && disk) {
    const diskBar = disk.usedPercent !== undefined ? buildBar(disk.usedPercent, 20, showColors) : '';
    const rows = [
      ['Total   ', disk.total],
      ['Used    ', disk.used],
      ['Free    ', disk.free],
    ];
    if (diskBar) rows.push(['Usage   ', diskBar]);
    out += box('DISK', rows, showColors);
  }

  // ── Battery ──
  if (showBattery && battery && battery.supported) {
    out += box('BATTERY', [
      ['Level   ', battery.level],
      ['Charging', battery.charging],
      ['Time    ', battery.timeRemaining],
    ], showColors);
  }

  // ── GPU ──
  if (showGPU && gpu && gpu.model !== 'N/A') {
    out += box('GPU', [
      ['Model   ', gpu.model.substring(0, 44)],
      ['Driver  ', gpu.driver],
    ], showColors);
  }

  // ── Process ──
  out += box('THIS PROCESS', [
    ['PID     ', proc.pid],
    ['Uptime  ', proc.uptime],
    ['RSS     ', proc.rss],
    ['Heap    ', `${proc.heapUsed} / ${proc.heapTotal}`],
  ], showColors);

  // ── Top Processes ──
  if (showProcesses && topProcs.length) {
    const rows = topProcs.map(p => [`${p.pid.toString().padStart(6)}`, `CPU:${p.cpu.padEnd(7)} MEM:${p.mem.padEnd(7)} ${p.name}`]);
    out += box('TOP PROCESSES (by mem)', rows, showColors);
  }

  // ── Footer ──
  out += cc(border, 'blue') + '\n';
  out += cc('  Developed by Crystal Studio Labs | Author: SahooShuvranshu', 'dim') + '\n';
  out += cc('  https://github.com/Crystal-Studio-Labs/crystalsystem.js', 'dim') + '\n';
  out += cc(border, 'blue') + '\n';

  return out;
}

// ─── Logger ──────────────────────────────────────────────────────
function createLogger(logFile) {
  return {
    write(stats) {
      try {
        const line = JSON.stringify(stats) + '\n';
        fs.appendFileSync(logFile, line, 'utf8');
      } catch {}
    },
    readAll() {
      try {
        return fs.readFileSync(logFile, 'utf8').trim().split('\n').map(l => JSON.parse(l));
      } catch { return []; }
    },
  };
}

// ─── HTTP Server ──────────────────────────────────────────────────
function startHttpServer(port = 3001, options = {}) {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getAllStats(options), null, 2));
    } else if (url === '/cpu') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getCPUInfo(), null, 2));
    } else if (url === '/memory') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getMemoryInfo(), null, 2));
    } else if (url === '/network') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getNetworkInfo(), null, 2));
    } else if (url === '/disk') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getDiskInfo(), null, 2));
    } else if (url === '/battery') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getBatteryInfo(), null, 2));
    } else if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not found',
        routes: ['/', '/cpu', '/memory', '/network', '/disk', '/battery', '/health']
      }));
    }
  });

  server.listen(port, () => {
    process.stdout.write(
      c(`\n  [CrystalSystem] HTTP API running at `, 'green') +
      c(`http://localhost:${port}`, 'cyan') + '\n'
    );
  });

  return server;
}

// ─── Alert System ────────────────────────────────────────────────
const DEFAULT_THRESHOLDS = {
  cpu: 90,
  memory: 85,
  disk: 90,
};

// ─── Main CrystalSystem Class ────────────────────────────────────
class CrystalSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      interval: 5000,
      clearConsole: true,
      showColors: true,
      showNetwork: true,
      showDisk: true,
      showBattery: true,
      showGPU: true,
      showProcesses: true,
      logFile: null,
      httpPort: null,
      thresholds: { ...DEFAULT_THRESHOLDS },
      historySize: 30,
      ...options,
    };
    this._timer = null;
    this._httpServer = null;
    this._logger = null;
    this._cpuHistory = [];
    this._memHistory = [];
    this._running = false;
  }

  _tick() {
    const cpu = getCPUInfo();
    const mem = getMemoryInfo();

    // History tracking for sparklines
    this._cpuHistory.push(cpu.loadRaw);
    this._memHistory.push(mem.usedPercent);
    if (this._cpuHistory.length > this.options.historySize) this._cpuHistory.shift();
    if (this._memHistory.length > this.options.historySize) this._memHistory.shift();

    const stats = getAllStats(this.options);
    this.emit('data', stats);

    // Alerts
    const { thresholds } = this.options;
    if (cpu.loadRaw > thresholds.cpu) {
      this.emit('alert', { type: 'cpu', message: `CPU usage critical: ${cpu.loadPercent}`, value: cpu.loadRaw, threshold: thresholds.cpu });
    }
    if (mem.usedPercent > thresholds.memory) {
      this.emit('alert', { type: 'memory', message: `Memory usage high: ${mem.percent}`, value: mem.usedPercent, threshold: thresholds.memory });
    }
    const disk = getDiskInfo();
    if (disk.usedPercent !== undefined && disk.usedPercent > thresholds.disk) {
      this.emit('alert', { type: 'disk', message: `Disk usage critical: ${disk.usedPercent}%`, value: disk.usedPercent, threshold: thresholds.disk });
    }

    // Log
    if (this._logger) this._logger.write(stats);

    return { cpu, mem, stats };
  }

  display() {
    this._tick();
    const table = buildSystemTable({
      ...this.options,
      cpuHistory: this._cpuHistory,
      memHistory: this._memHistory,
    });
    if (this.options.clearConsole) console.clear();
    console.log(table);
  }

  start() {
    if (this._running) return this;
    this._running = true;

    if (this.options.logFile) {
      this._logger = createLogger(this.options.logFile);
    }

    if (this.options.httpPort) {
      this._httpServer = startHttpServer(this.options.httpPort, this.options);
    }

    this.display();

    if (this.options.interval > 0) {
      this._timer = setInterval(() => this.display(), this.options.interval);
      if (this._timer.unref) this._timer.unref();
    }

    return this;
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._httpServer) { this._httpServer.close(); this._httpServer = null; }
    this._running = false;
    this.emit('stop');
    return this;
  }

  snapshot() {
    return getAllStats(this.options);
  }

  setThreshold(type, value) {
    this.options.thresholds[type] = value;
    return this;
  }
}

// ─── Convenience factory ─────────────────────────────────────────
function crystalsystem(options = {}) {
  const instance = new CrystalSystem(options);
  return instance.start();
}

// ─── Exports ─────────────────────────────────────────────────────
module.exports = {
  crystalsystem,
  CrystalSystem,
  buildSystemTable,
  getAllStats,
  getPlatformInfo,
  getCPUInfo,
  getMemoryInfo,
  getNetworkInfo,
  getDiskInfo,
  getBatteryInfo,
  getGPUInfo,
  getProcessInfo,
  getTopProcesses,
  startHttpServer,
  createLogger,
  formatBytes,
  sparkline,
};

// Auto-run if executed directly
if (require.main === module) {
  crystalsystem();
}

//=================================================================
// CRYSTAL SYSTEM.JS v1.0.2
// Crystal Studio Labs | Author: SahooShuvranshu
// https://github.com/Crystal-Studio-Labs/crystalsystem.js
//=================================================================

