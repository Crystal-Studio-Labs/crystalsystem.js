'use strict';
// Basic smoke tests — run with: node test.js

const assert = (cond, msg) => { if (!cond) throw new Error(`FAIL: ${msg}`); console.log(`  ✓  ${msg}`); };

const {
  getPlatformInfo, getCPUInfo, getMemoryInfo,
  getNetworkInfo, getDiskInfo, getBatteryInfo,
  getGPUInfo, getProcessInfo, getTopProcesses,
  buildSystemTable, getAllStats, formatBytes,
  sparkline, createLogger, CrystalSystem,
} = require('./index.js');

console.log('\n  Crystal System.JS — Test Suite\n');

// formatBytes
assert(formatBytes(0) === '0 B', 'formatBytes(0)');
assert(formatBytes(1024) === '1 KB', 'formatBytes(1024)');
assert(formatBytes(1073741824) === '1 GB', 'formatBytes(1GB)');

// sparkline
const sp = sparkline([10, 50, 90, 30], 10);
assert(typeof sp === 'string' && sp.length > 0, 'sparkline returns string');

// Platform
const plat = getPlatformInfo();
assert(typeof plat.platformName === 'string', 'getPlatformInfo().platformName');
assert(typeof plat.hostname === 'string', 'getPlatformInfo().hostname');

// CPU
const cpu = getCPUInfo();
assert(typeof cpu.model === 'string', 'getCPUInfo().model');
assert(typeof cpu.cores === 'number' && cpu.cores >= 1, 'getCPUInfo().cores >= 1 (Termux fallback safe)');
assert(typeof cpu.loadRaw === 'number', 'getCPUInfo().loadRaw is number');

// Memory
const mem = getMemoryInfo();
assert(typeof mem.total === 'string', 'getMemoryInfo().total');
assert(typeof mem.usedPercent === 'number', 'getMemoryInfo().usedPercent');

// Network
const net = getNetworkInfo();
assert(typeof net.inbound === 'string', 'getNetworkInfo().inbound');
assert(Array.isArray(net.interfaces), 'getNetworkInfo().interfaces is array');

// Disk
const disk = getDiskInfo();
assert(typeof disk.total === 'string', 'getDiskInfo().total');

// Battery
const bat = getBatteryInfo();
assert(typeof bat.supported === 'boolean', 'getBatteryInfo().supported is boolean');

// GPU
const gpu = getGPUInfo();
assert(typeof gpu.model === 'string', 'getGPUInfo().model');

// Process
const proc = getProcessInfo();
assert(typeof proc.pid === 'number', 'getProcessInfo().pid');
assert(typeof proc.heapUsed === 'string', 'getProcessInfo().heapUsed');

// Top processes
const tops = getTopProcesses(3);
assert(Array.isArray(tops), 'getTopProcesses returns array');

// buildSystemTable
const table = buildSystemTable({ showColors: false });
assert(typeof table === 'string' && table.length > 100, 'buildSystemTable returns non-empty string');
assert(table.includes('CRYSTAL SYSTEM.JS'), 'Table includes header');
assert(table.includes('CPU'), 'Table includes CPU section');
assert(table.includes('MEMORY'), 'Table includes MEMORY section');

// getAllStats
const stats = getAllStats({ showColors: false });
assert(stats.timestamp, 'getAllStats has timestamp');
assert(stats.cpu && stats.memory, 'getAllStats has cpu and memory');

// CrystalSystem class — event emitter
const cs = new CrystalSystem({ interval: 0, clearConsole: false, httpPort: null });
assert(typeof cs.on === 'function', 'CrystalSystem is EventEmitter');
assert(typeof cs.snapshot === 'function', 'CrystalSystem.snapshot()');
const snap = cs.snapshot();
assert(snap.cpu, 'snapshot has cpu');

// Logger
const os = require('os');
const logPath = require('path').join(os.tmpdir(), 'crystalsystem_test.json');
const logger = createLogger(logPath);
logger.write(stats);
const all = logger.readAll();
assert(all.length === 1, 'logger.readAll() returns 1 entry');
require('fs').unlinkSync(logPath);

console.log('\n  All tests passed! ✅\n');

