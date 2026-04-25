<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=260&section=header&text=CrystalSystem.js&fontSize=85&fontAlignY=40&animation=twinkling&fontColor=000000&color=ff0000&desc=Real-time%20system%20monitor%20for%20Node.js%20%7C%20Web%20Dashboard%2C%20Alerts%2C%20API%2C%20CLI%2C%20Zero%20Dependencies&descAlignY=68&descSize=20" />
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
  <img src="https://img.shields.io/badge/version-1.1.0--alpha.1-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/status-alpha-orange?style=for-the-badge" />
  <a href="https://discord.gg/EdbUJHNv9J">
    <img src="https://img.shields.io/badge/Discord-Support-5865F2?style=for-the-badge&logo=discord" />
  </a>
</p>

<p align="center">
  <b>Real-time system monitor for Node.js — now with a live web dashboard.</b><br/>
  CPU, RAM, Disk, Network, Battery, GPU. Zero dependencies. Works on Linux, macOS, Windows, Android (Termux) and BSD.
</p>

<p align="center">
  Developed by <a href="https://github.com/Crystal-Studio-Labs"><b>Crystal Studio Labs</b></a> &nbsp;·&nbsp; Author <a href="https://github.com/SahooShuvranshu"><b>SahooShuvranshu</b></a>
</p>

---

> ⚠️ **This is an alpha release on the `feature/web-dashboard` branch.**
> APIs may change before the stable `v1.1.0` release.
> Found a bug? [Open an issue](https://github.com/Crystal-Studio-Labs/crystalsystem.js/issues) and tag it `alpha`.

---

<p align="center">
  <img height="28" src="https://count.getloli.com/@CrystalSystemJs?name=CrystalSystemJs&theme=3d-num&padding=7&offset=0&align=center&scale=1&pixelated=1&darkmode=1" /><br/>
  <sub><b>🚀 Total Visitors | 👀 Repo Traffic</b></sub>
</p>

---

## 🆕 What's New in v1.1.0-alpha.1

The biggest addition to crystalsystem.js yet — a **live web dashboard** that runs in your browser and updates in real time over WebSocket.

- ✅ Zero new dependencies — WebSocket server built with Node's built-in `http` module
- ✅ Everything in one file — entire dashboard HTML is embedded, no static folder needed
- ✅ Fully backwards compatible — terminal mode still works exactly as before
- ✅ New `--dashboard` CLI flag
- ✅ New `dashboard: true` option

---

## 📦 Installation

Install the alpha version specifically:

```sh
npm install @crystal-studio-labs/crystalsystem.js@alpha
```

> Regular `npm install` still gives everyone the stable `v1.0.4`. Only people who ask for `@alpha` get this version.

---

## 🌐 Web Dashboard — Quick Start

```js
const { crystalsystem } = require('@crystal-studio-labs/crystalsystem.js');

// Opens live dashboard at http://localhost:4000
crystalsystem({
  dashboard:            true,
  dashboardPort:        4000,   // default
  dashboardOpenBrowser: true,   // auto-opens your browser
  interval:             2000,   // push stats every 2 seconds
});
```

Or from the CLI:

```sh
# Open dashboard — auto-opens browser
crystalsystem --dashboard

# Custom port
crystalsystem --dashboard --dashboard-port 8080

# Dashboard without auto-opening browser (good for Termux)
crystalsystem --dashboard --no-browser
```

---

## 🖥️ Dashboard Widgets

| Widget | What it shows |
|---|---|
| ⚙️ CPU Gauge | Animated ring — green → yellow → red by load % |
| 📈 CPU Chart | 40-point live history line chart |
| 🧠 Memory Gauge | Animated ring with history chart |
| 📡 Network | Live download / upload speed + totals + interfaces |
| 💽 Disk | Usage bar with total / used / free |
| 🔋 Battery | Visual battery level + charging status |
| 🎮 GPU | Model and driver info |
| 🖥️ Platform | OS, arch, hostname, Node.js version, PID, heap |
| ⏱️ Uptime | Live ticking counter — updates every second |
| 🔝 Top Processes | Live table sorted by memory, 8 entries |
| 🔔 Alert Log | Threshold breach log with timestamps, clearable |

---

## ⚙️ Options

All existing v1.0.x options still work. These are the new ones added in v1.1.0:

```js
const { crystalsystem } = require('@crystal-studio-labs/crystalsystem.js');

crystalsystem({
  // ── Existing options (unchanged) ──────────────────────
  interval:      2000,
  clearConsole:  true,
  showColors:    true,
  showNetwork:   true,
  showDisk:      true,
  showBattery:   true,
  showGPU:       true,
  showProcesses: true,
  historySize:   30,
  logFile:       'stats.json',
  httpPort:      3001,
  thresholds: {
    cpu:    80,
    memory: 75,
    disk:   85,
  },

  // ── New in v1.1.0 ─────────────────────────────────────
  dashboard:            true,   // Enable web dashboard mode
  dashboardPort:        4000,   // Port to serve dashboard on (default: 4000)
  dashboardOpenBrowser: true,   // Auto-open browser on start (default: true)
});
```

---

## 🔔 Alerts

Alerts work exactly the same as before — and they now also show up live in the dashboard's Alert Log widget:

```js
const { CrystalSystem } = require('@crystal-studio-labs/crystalsystem.js');

const cs = new CrystalSystem({
  dashboard:  true,
  interval:   2000,
  thresholds: {
    cpu:    80,
    memory: 75,
    disk:   85,
  },
});

// Still fires — even in dashboard mode
cs.on('alert', ({ type, message, value, threshold }) => {
  console.log(`⚠️  ALERT [${type}] — ${message}`);
});

cs.start();
```

---

## 📡 Live Data Events

Dashboard mode still emits all events every tick:

```js
const { CrystalSystem } = require('@crystal-studio-labs/crystalsystem.js');

const cs = new CrystalSystem({ dashboard: true, interval: 2000 });

cs.on('data', (stats) => {
  console.log('CPU   :', stats.cpu.loadPercent);
  console.log('RAM   :', stats.memory.percent);
  console.log('Net ↓ :', stats.network.rxSpeed);
  console.log('Net ↑ :', stats.network.txSpeed);
});

cs.start();

// Stop the monitor after 30 seconds
setTimeout(() => cs.stop(), 30_000);
```

---

## 🌐 HTTP API Server

Run the HTTP API alongside the dashboard at the same time:

```js
crystalsystem({
  dashboard:  true,
  httpPort:   3001,
});

// Dashboard → http://localhost:4000
// JSON API  → http://localhost:3001
```

```sh
curl http://localhost:3001/
curl http://localhost:3001/cpu
curl http://localhost:3001/memory
curl http://localhost:3001/network
curl http://localhost:3001/disk
curl http://localhost:3001/battery
curl http://localhost:3001/health
```

---

## 📝 Log Stats to a File

Works the same as before — fully compatible with dashboard mode:

```js
crystalsystem({
  dashboard: true,
  logFile:   'stats.json',
  interval:  10_000,
});
```

---

## 🔧 Using the Dashboard Server Directly

Start just the dashboard server without any terminal output:

```js
const { createDashboardServer } = require('@crystal-studio-labs/crystalsystem.js');

const { server, stop } = createDashboardServer({
  port:        4000,
  interval:    2000,
  openBrowser: true,
  thresholds:  { cpu: 80, memory: 75, disk: 85 },
  onStats: (stats) => {
    console.log(stats.cpu.loadPercent);
  },
});

// Stop after 60 seconds
setTimeout(() => stop(), 60_000);
```

---

## 🔢 Individual Stats (No Dashboard)

All existing individual functions still work:

```js
const {
  getCPUInfo, getMemoryInfo, getNetworkInfo,
  getDiskInfo, getBatteryInfo, getGPUInfo,
  getTopProcesses, getAllStats, formatBytes,
} = require('@crystal-studio-labs/crystalsystem.js');

const cpu = getCPUInfo();
console.log(cpu.model);       // "Snapdragon 8 Gen 2"
console.log(cpu.cores);       // 8
console.log(cpu.loadPercent); // "42.50%"

console.log(formatBytes(1_073_741_824)); // "1 GB"
```

---

## 🖥️ CLI — All Flags

New flags in v1.1.0-alpha.1:

| Flag | Short | What it does |
|---|---|---|
| `--dashboard` | `-d` | Start live web dashboard |
| `--dashboard-port <port>` | `--dp` | Set dashboard port (default: 4000) |
| `--no-browser` | | Don't auto-open browser |

All existing flags still work:

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

New types added for dashboard options:

```typescript
import crystalsystem, {
  CrystalSystem,
  CrystalSystemOptions,
  SystemStats,
  AlertEvent,
} from '@crystal-studio-labs/crystalsystem.js';

const options: CrystalSystemOptions = {
  dashboard:            true,
  dashboardPort:        4000,
  dashboardOpenBrowser: true,
  interval:             2000,
  thresholds: { cpu: 80, memory: 75 },
};

const cs: CrystalSystem = crystalsystem(options);

cs.on('data',  (stats: SystemStats) => console.log(stats.cpu.loadPercent));
cs.on('alert', (alert: AlertEvent)  => console.error(alert.message));
```

---

## 📋 Full API Reference

### Functions

| Function | Description |
|---|---|
| `crystalsystem(options?)` | Start monitor. Returns a `CrystalSystem` instance. |
| `new CrystalSystem(options?)` | Create an instance manually. Call `.start()` when ready. |
| `createDashboardServer(options?)` | Start dashboard server independently. |
| `buildSystemTable(options?)` | Get the full terminal dashboard as a string. |
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
| `formatBytes(bytes, decimals?)` | Convert bytes to a readable string. |
| `sparkline(history, width?)` | Generate a sparkline from an array of numbers. |

### CrystalSystem Methods

| Method | Description |
|---|---|
| `.start()` | Start the monitor or dashboard. |
| `.stop()` | Stop everything — monitor, dashboard, HTTP server. |
| `.display()` | Render terminal dashboard once (terminal mode only). |
| `.snapshot()` | Get a one-time snapshot of all stats. |
| `.setThreshold(type, value)` | Change a threshold while running. |
| `.on('data', fn)` | Fires every tick with full stats. |
| `.on('alert', fn)` | Fires when a threshold is exceeded. |
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

**Does the web dashboard slow down my app?**
No. The WebSocket server is lightweight and only activates when a browser is connected. It reads the same OS APIs as terminal mode.

**Does it work on Termux (Android)?**
Yes. Use `--no-browser` since Termux can't auto-launch browsers, then open `http://localhost:4000` manually in your phone browser.

**Can I run the dashboard and HTTP API together?**
Yes. Use `dashboard: true` and `httpPort: 3001` at the same time.

**Is this backwards compatible with v1.0.4?**
Yes. All existing options, functions and events are completely unchanged. The dashboard is 100% opt-in.

**How does the WebSocket work with no extra packages?**
Node's built-in `http` module supports an `upgrade` event for WebSocket connections. The SHA-1 handshake uses Node's built-in `crypto` module. Frame encoding is ~30 lines of vanilla JavaScript.

---

## 🗺️ Roadmap to v1.1.0 Stable

- [x] Live web dashboard with WebSocket
- [x] CPU and memory gauges with history charts
- [x] Network speed chart
- [x] Top processes table
- [x] Alert log panel
- [x] `--dashboard` CLI flag
- [ ] Per-core CPU breakdown widget
- [ ] Temperature monitoring (Linux / Android)
- [ ] Dashboard password protection option
- [ ] Dark / light theme toggle
- [ ] TypeScript definitions for new options
- [ ] CHANGELOG.md updated for v1.1.0

---

## 💬 Need Help? Join Discord

<p align="center">
  <a href="https://discord.gg/EdbUJHNv9J">
    <img src="https://discordapp.com/api/guilds/1075092446880485376/widget.png?style=banner2" width="90%" />
  </a>
</p>

---

## ⭐️ Star History

<a href="https://www.star-history.com/?repos=Crystal-Studio-Labs%2Fcrystalsystem.js&type=timeline&logscale=&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Crystal-Studio-Labs/crystalsystem.js&type=timeline&theme=dark&logscale&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Crystal-Studio-Labs/crystalsystem.js&type=timeline&logscale&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Crystal-Studio-Labs/crystalsystem.js&type=timeline&logscale&legend=bottom-right" />
 </picture>
</a>

---

## 📄 License

[MIT](./LICENSE) — © Crystal Studio Labs · SahooShuvranshu

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=180&section=footer&color=ff0000" />
</p>

