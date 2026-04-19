<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=260&section=header&text=CrystalSystem.js&fontSize=85&fontAlignY=40&animation=twinkling&fontColor=000000&color=ff0000&desc=Real-time%20system%20monitor%20for%20Node.js%20%7C%20Alerts,%20API,%20CLI,%20Zero%20Dependencies&descAlignY=68&descSize=22" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js">
    <img src="https://nodei.co/npm/%40crystal-studio-labs%2Fcrystalsystem.js.png?downloads=true&downloadRank=true&stars=true" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js">
    <img src="https://img.shields.io/badge/npm%20install-@crystal--studio--labs%2Fcrystalsystem.js-red?style=for-the-badge&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js">
    <img src="https://img.shields.io/npm/v/@crystal-studio-labs/crystalsystem.js?style=for-the-badge&color=red&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js">
    <img src="https://img.shields.io/npm/dt/@crystal-studio-labs/crystalsystem.js?style=for-the-badge&color=red&logo=npm" />
  </a>
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js">
    <img src="https://img.shields.io/npm/l/@crystal-studio-labs/crystalsystem.js?style=for-the-badge&color=red" />
  </a>
  <a href="https://discord.gg/EdbUJHNv9J">
    <img src="https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord" />
  </a>
</p>

<p align="center">
  <b>Real-time system monitor for Node.js — CPU, RAM, Disk, Network, Battery & more.</b><br/>
  Zero dependencies. Works on Linux, macOS, Windows, Android (Termux) and BSD.
</p>

<p align="center">
  Developed by <a href="https://github.com/Crystal-Studio-Labs"><b>Crystal Studio Labs</b></a> &nbsp;·&nbsp; Author <a href="https://github.com/SahooShuvranshu"><b>SahooShuvranshu</b></a>
</p>

---

## 📦 Installation

```sh
npm install crystalsystem.js
```

That's it. No external packages are installed — it uses only Node.js built-ins.

---

## 🚀 Quick Start

Drop this into any Node.js file and run it:

```js
const { crystalsystem } = require('crystalsystem.js');

crystalsystem();
```

Your terminal will show a live dashboard that refreshes every 5 seconds.

---

## 🖥️ What You'll See

```
════════════════════════════════════════════════════════════
█   CRYSTAL SYSTEM.JS v1.0.0     SYSTEM INFORMATION    █
════════════════════════════════════════════════════════════

┌─ PLATFORM ─────────────────────────────────────────────┐
│ OS        Android 12 (aarch64)                         │
│ Hostname  localhost                                     │
│ Uptime    3h 22m 10s                                   │
└────────────────────────────────────────────────────────┘

┌─ CPU ───────────────────────────────────────────────────┐
│ Model     Qualcomm Snapdragon 8 Gen 1                  │
│ Cores     8 threads                                    │
│ Usage     ████████░░░░░░░░░░░░ 42%  ▂▃▄▅▆▄▃▂          │
└────────────────────────────────────────────────────────┘

┌─ MEMORY ────────────────────────────────────────────────┐
│ Total     8 GB                                         │
│ Used      3.4 GB (42.50%)                              │
│ Free      4.6 GB                                       │
│ Usage     ████████░░░░░░░░░░░░ 42%  ▃▃▄▄▅▄▃▃          │
└────────────────────────────────────────────────────────┘

┌─ NETWORK ───────────────────────────────────────────────┐
│ Total ↓   1.2 GB                                       │
│ Total ↑   340 MB                                       │
│ Speed ↓   1.4 MB/s                                     │
│ Speed ↑   220 KB/s                                     │
└────────────────────────────────────────────────────────┘
```

---

## ⚙️ Options

You can customize everything by passing an options object:

```js
const { crystalsystem } = require('crystalsystem.js');

crystalsystem({
  interval:      5000,   // How often to refresh in milliseconds (default: 5000)
  clearConsole:  true,   // Clear the terminal before each refresh (default: true)
  showColors:    true,   // Show colored output (default: true)
  showNetwork:   true,   // Show network section (default: true)
  showDisk:      true,   // Show disk section (default: true)
  showBattery:   true,   // Show battery section (default: true)
  showGPU:       true,   // Show GPU section (default: true)
  showProcesses: true,   // Show top processes section (default: true)
  historySize:   30,     // How many data points to keep for sparklines (default: 30)

  // Optional: save stats to a file
  logFile: 'stats.json',

  // Optional: start a live JSON API server
  httpPort: 3001,

  // Optional: get notified when usage is too high
  thresholds: {
    cpu:    90,   // Alert when CPU  is over 90%
    memory: 85,   // Alert when RAM  is over 85%
    disk:   90,   // Alert when Disk is over 90%
  },
});
```

---

## 🔔 Alerts

Get notified automatically when your system is under pressure:

```js
const { CrystalSystem } = require('crystalsystem.js');

const cs = new CrystalSystem({
  interval: 3000,
  thresholds: {
    cpu:    80,
    memory: 75,
    disk:   90,
  },
});

// This fires whenever a threshold is exceeded
cs.on('alert', ({ type, message, value, threshold }) => {
  console.log(`⚠️  ALERT [${type}] — ${message}`);
  // You can send a Discord message, restart a process, write a log, anything.
});

cs.start();
```

---

## 📡 Live Data Events

Listen to every tick of data — useful for building your own integrations:

```js
const { CrystalSystem } = require('crystalsystem.js');

const cs = new CrystalSystem({ interval: 2000 });

cs.on('data', (stats) => {
  console.log('CPU usage  :', stats.cpu.loadPercent);
  console.log('RAM usage  :', stats.memory.percent);
  console.log('Download   :', stats.network.rxSpeed);
  console.log('Upload     :', stats.network.txSpeed);
});

cs.start();

// Stop the monitor after 30 seconds
setTimeout(() => cs.stop(), 30_000);
```

The `stats` object contains everything — platform, CPU, memory, network, disk, battery, GPU, and top processes.

---

## 🌐 HTTP API Server

Start a live JSON API that any browser, app, or tool can query:

```js
const { crystalsystem } = require('crystalsystem.js');

crystalsystem({ httpPort: 3001 });
```

Now open your browser or use `curl`:

```sh
curl http://localhost:3001/
curl http://localhost:3001/cpu
curl http://localhost:3001/memory
curl http://localhost:3001/network
curl http://localhost:3001/disk
curl http://localhost:3001/battery
curl http://localhost:3001/health
```

Every response is JSON. Great for wiring into Grafana, Discord bots, web dashboards, or any monitoring setup.

---

## 📝 Log Stats to a File

Save a history of your system stats to a file automatically:

```js
const { crystalsystem } = require('crystalsystem.js');

crystalsystem({
  logFile:  'stats.json',
  interval: 10_000,       // Log every 10 seconds
});
```

Or write and read logs manually:

```js
const { createLogger, getAllStats } = require('crystalsystem.js');

const logger = createLogger('stats.json');

// Save a snapshot right now
logger.write(getAllStats());

// Read all saved snapshots back
const history = logger.readAll();
console.log(`Saved ${history.length} entries`);

// Find the highest CPU spike ever recorded
const peakCPU = Math.max(...history.map(s => s.cpu.loadRaw));
console.log(`Peak CPU: ${peakCPU}%`);
```

Each entry is one JSON line in the file — easy to read, grep, or import anywhere.

---

## 🔢 Get Individual Stats (No Dashboard)

Use any function on its own without starting a monitor:

```js
const {
  getCPUInfo,
  getMemoryInfo,
  getNetworkInfo,
  getDiskInfo,
  getBatteryInfo,
  getGPUInfo,
  getTopProcesses,
  getAllStats,
  formatBytes,
} = require('crystalsystem.js');

// CPU
const cpu = getCPUInfo();
console.log(cpu.model);       // "Qualcomm Snapdragon 8 Gen 1"
console.log(cpu.cores);       // 8
console.log(cpu.loadPercent); // "42.50%"

// Memory
const mem = getMemoryInfo();
console.log(mem.total);       // "8 GB"
console.log(mem.used);        // "3.4 GB (42.50%)"

// Network
const net = getNetworkInfo();
console.log(net.rxSpeed);     // "1.4 MB/s"
console.log(net.txSpeed);     // "220 KB/s"

// Top 5 processes by memory
const procs = getTopProcesses(5);
procs.forEach(p => {
  console.log(`${p.name} — CPU: ${p.cpu}  RAM: ${p.mem}`);
});

// Everything at once
const all = getAllStats();
console.log(all.platform.platformName); // "Android"
console.log(all.disk.total);            // "128 GB"

// Format any byte number
console.log(formatBytes(1_073_741_824)); // "1 GB"
```

---

## 🖥️ CLI — Use From Your Terminal

Install globally to get the `crystalsystem` command:

```sh
npm install -g crystalsystem.js
```

Then run it anywhere:

```sh
# Live dashboard
crystalsystem

# Refresh every 2 seconds
crystalsystem -i 2

# Show once and exit
crystalsystem --once

# Get a raw JSON snapshot
crystalsystem --json

# Start with HTTP API and file logging
crystalsystem -p 3001 -l stats.json

# Hide sections you don't need
crystalsystem --no-gpu --no-battery --no-disk

# Show all available flags
crystalsystem --help
```

### All CLI Flags

| Flag | Short | What it does |
|---|---|---|
| `--help` | `-h` | Show help |
| `--once` | `-o` | Show dashboard once and exit |
| `--json` | `-j` | Print JSON snapshot and exit |
| `--interval <sec>` | `-i` | Refresh every N seconds |
| `--port <port>` | `-p` | Start HTTP API on this port |
| `--log <file>` | `-l` | Save stats to a JSON log file |
| `--no-color` | | Turn off colors |
| `--no-network` | | Hide network section |
| `--no-disk` | | Hide disk section |
| `--no-battery` | | Hide battery section |
| `--no-gpu` | | Hide GPU section |
| `--no-processes` | | Hide top processes |
| `--no-clear` | | Don't clear screen between updates |

---

## 📘 TypeScript Support

Full type definitions are included — no `@types` package needed:

```typescript
import crystalsystem, {
  CrystalSystem,
  CrystalSystemOptions,
  SystemStats,
  AlertEvent,
  CPUInfo,
  MemoryInfo,
} from 'crystalsystem.js';

const options: CrystalSystemOptions = {
  interval: 3000,
  thresholds: { cpu: 80, memory: 80 },
};

const cs: CrystalSystem = crystalsystem(options);

cs.on('data', (stats: SystemStats) => {
  const cpu: CPUInfo    = stats.cpu;
  const mem: MemoryInfo = stats.memory;
  console.log(cpu.loadPercent, mem.percent);
});

cs.on('alert', (alert: AlertEvent) => {
  console.error(`[${alert.type.toUpperCase()}] ${alert.message}`);
});
```

---

## 📋 Full API Reference

### Main Functions

| Function | Description |
|---|---|
| `crystalsystem(options?)` | Start the live dashboard. Returns a `CrystalSystem` instance. |
| `new CrystalSystem(options?)` | Create an instance manually. Call `.start()` when ready. |
| `buildSystemTable(options?)` | Get the full dashboard as a string — no loop started. |
| `getAllStats(options?)` | Get all system stats as one object — no display. |
| `startHttpServer(port?, options?)` | Start the HTTP API server on its own. |
| `createLogger(filePath)` | Create a file logger for saving stats. |
| `getCPUInfo()` | CPU model, speed, cores, real usage %. |
| `getMemoryInfo()` | Total, used, free memory. |
| `getNetworkInfo()` | Traffic totals and live speed. |
| `getDiskInfo()` | Disk partitions, total, used, free. |
| `getBatteryInfo()` | Battery level and charging status. |
| `getGPUInfo()` | GPU model where available. |
| `getProcessInfo()` | PID, Node.js version, heap memory. |
| `getTopProcesses(limit?)` | Top N processes sorted by memory. |
| `formatBytes(bytes, decimals?)` | Convert bytes to a readable string like `"1.5 GB"`. |
| `sparkline(history, width?)` | Generate a sparkline string from an array of numbers. |

### CrystalSystem Methods

| Method | Description |
|---|---|
| `.start()` | Start the monitor. |
| `.stop()` | Stop the monitor and shut down HTTP server if running. |
| `.display()` | Render and print the dashboard once right now. |
| `.snapshot()` | Get a one-time snapshot of all stats. |
| `.setThreshold(type, value)` | Change an alert threshold while running. |
| `.on('data', fn)` | Listen to every stats update. |
| `.on('alert', fn)` | Listen to threshold alerts. |
| `.on('stop', fn)` | Fires when the monitor stops. |

---

## 🌍 Platform Support

| Platform | CPU | Memory | Disk | Network | Battery | GPU |
|---|---|---|---|---|---|---|
| 🐧 Linux | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🤖 Android / Termux | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🍎 macOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🪟 Windows | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 😈 FreeBSD / OpenBSD | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

> Battery and GPU on Windows are not yet supported.

---

## ❓ FAQ

**Does this slow down my app?**
No. It reads from OS APIs that are already available — no extra processes are spawned unless you use GPU or battery detection on specific platforms.

**Can I use it in production?**
Yes. Set `interval: 0` to get a one-shot snapshot, or use the event emitter API to integrate with your own logging or alerting system without showing the dashboard.

**Does it work on Termux (Android)?**
Yes. It falls back to `/proc/cpuinfo` when Android restricts `os.cpus()`, so CPU info still works correctly.

**Can I send the stats somewhere?**
Yes — use `cs.on('data', fn)` to receive every update and do whatever you want with it: send to a database, post to a webhook, broadcast over a WebSocket, etc.

---
## 🗨 Join Discord

<p align="center">
  <a href="https://discord.gg/EdbUJHNv9J">
    <img src="https://discordapp.com/api/guilds/1075092446880485376/widget.png?style=banner3" width="90%" />
  </a>
</p>

---

## 📄 License

[MIT](./LICENSE) — © Crystal Studio Labs · SahooShuvranshu

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=260&section=footer&color=ff0000" />
</p>

