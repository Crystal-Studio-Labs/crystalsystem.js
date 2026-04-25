#!/usr/bin/env node
//=================================================================
// CRYSTAL SYSTEM.JS — CLI Binary
// Crystal Studio Labs | Author: SahooShuvranshu
//=================================================================

'use strict';

const { crystalsystem, buildSystemTable, getAllStats } = require('./index.js');

const args = process.argv.slice(2);

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') { opts.help = true; }
    else if (arg === '--once' || arg === '-o') { opts.once = true; }
    else if (arg === '--json' || arg === '-j') { opts.json = true; }
    else if (arg === '--dashboard' || arg === '-d') { opts.dashboard = true; }
    else if (arg === '--no-browser') { opts.dashboardOpenBrowser = false; }
    else if (arg === '--no-color') { opts.showColors = false; }
    else if (arg === '--no-network') { opts.showNetwork = false; }
    else if (arg === '--no-disk') { opts.showDisk = false; }
    else if (arg === '--no-battery') { opts.showBattery = false; }
    else if (arg === '--no-gpu') { opts.showGPU = false; }
    else if (arg === '--no-processes') { opts.showProcesses = false; }
    else if (arg === '--no-clear') { opts.clearConsole = false; }
    else if ((arg === '--interval' || arg === '-i') && argv[i + 1]) {
      opts.interval = parseInt(argv[++i], 10) * 1000;
    } else if ((arg === '--port' || arg === '-p') && argv[i + 1]) {
      opts.httpPort = parseInt(argv[++i], 10);
    } else if ((arg === '--dashboard-port' || arg === '--dp') && argv[i + 1]) {
      opts.dashboardPort = parseInt(argv[++i], 10);
    } else if ((arg === '--log' || arg === '-l') && argv[i + 1]) {
      opts.logFile = argv[++i];
    }
  }
  return opts;
}

const HELP = `
  \x1b[1m\x1b[36mCrystal System.JS v1.1.0-alpha.1\x1b[0m — System Monitor CLI
  \x1b[2mCrystal Studio Labs | Author: SahooShuvranshu\x1b[0m
  \x1b[2mhttps://github.com/Crystal-Studio-Labs/crystalsystem.js\x1b[0m

  \x1b[1mUsage:\x1b[0m
    crystalsystem [options]

  \x1b[1mModes:\x1b[0m
    (default)            Live terminal dashboard
    -d, --dashboard      Open live web dashboard in browser

  \x1b[1mOptions:\x1b[0m
    -h, --help               Show this help message
    -o, --once               Display once and exit (no loop)
    -j, --json               Output raw JSON snapshot and exit
    -d, --dashboard          Start web dashboard (default port 4000)
        --dashboard-port N   Set dashboard port (default: 4000)
        --no-browser         Don't auto-open browser
    -i, --interval <sec>     Refresh interval in seconds (default: 5)
    -p, --port <port>        Start HTTP JSON API on given port
    -l, --log <file>         Log stats to a JSON file
        --no-color           Disable colored output
        --no-network         Hide network section
        --no-disk            Hide disk section
        --no-battery         Hide battery section
        --no-gpu             Hide GPU section
        --no-processes       Hide top processes section
        --no-clear           Don't clear console between updates

  \x1b[1mExamples:\x1b[0m
    crystalsystem                        # Live terminal monitor
    crystalsystem --dashboard            # Live web dashboard at :4000
    crystalsystem --dashboard --dp 8080  # Web dashboard at :8080
    crystalsystem --dashboard --no-browser  # Dashboard without auto-open
    crystalsystem -i 2                   # Refresh every 2 seconds
    crystalsystem -o                     # Show once and exit
    crystalsystem -j                     # JSON snapshot to stdout
    crystalsystem -p 3001                # + HTTP JSON API at :3001
    crystalsystem -l stats.json          # + log to file

  \x1b[1mHTTP API Routes (when --port is used):\x1b[0m
    GET /            All stats (JSON)
    GET /cpu         CPU info
    GET /memory      Memory info
    GET /network     Network info
    GET /disk        Disk info
    GET /battery     Battery info
    GET /health      Health check
`;

const opts = parseArgs(args);

if (opts.help) {
  console.log(HELP);
  process.exit(0);
}

if (opts.json) {
  const stats = getAllStats(opts);
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

if (opts.once) {
  const table = buildSystemTable({ showColors: opts.showColors !== false, ...opts });
  console.log(table);
  process.exit(0);
}

// Dashboard mode
if (opts.dashboard) {
  const { crystalsystem } = require('./index.js');
  const instance = crystalsystem({
    dashboard:            true,
    dashboardPort:        opts.dashboardPort || 4000,
    dashboardOpenBrowser: opts.dashboardOpenBrowser !== false,
    interval:             opts.interval || 2000,
    logFile:              opts.logFile   || null,
    httpPort:             opts.httpPort  || null,
    thresholds: {
      cpu:    80,
      memory: 75,
      disk:   85,
    },
  });

  instance.on('alert', (alert) => {
    process.stderr.write(`\x1b[33m[ALERT]\x1b[0m ${alert.message}\n`);
  });

  process.on('SIGINT', () => {
    instance.stop();
    console.log('\n\x1b[36m[CrystalSystem] Dashboard stopped.\x1b[0m\n');
    process.exit(0);
  });
  return;
}

// Live monitor
const instance = crystalsystem({
  interval: opts.interval || 5000,
  clearConsole: opts.clearConsole !== false,
  showColors: opts.showColors !== false,
  showNetwork: opts.showNetwork !== false,
  showDisk: opts.showDisk !== false,
  showBattery: opts.showBattery !== false,
  showGPU: opts.showGPU !== false,
  showProcesses: opts.showProcesses !== false,
  httpPort: opts.httpPort || null,
  logFile: opts.logFile || null,
});

// Alert handler for CLI
instance.on('alert', (alert) => {
  process.stderr.write(`\x1b[33m[ALERT]\x1b[0m ${alert.message}\n`);
});

process.on('SIGINT', () => {
  instance.stop();
  console.log('\n\x1b[36m[CrystalSystem] Stopped.\x1b[0m\n');
  process.exit(0);
});

