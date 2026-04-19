// Type definitions for crystalsystem.js v1.0.0 — Epic Edition
// Crystal Studio Labs | Author: SahooShuvranshu
// https://github.com/Crystal-Studio-Labs/crystalsystem.js

/// <reference types="node" />

import { EventEmitter } from 'events';
import { Server } from 'http';

// ─── Data Interfaces ──────────────────────────────────────────────

export interface PlatformInfo {
  platform: string;
  platformName: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'FreeBSD' | 'OpenBSD' | 'Solaris' | string;
  arch: string;
  release: string;
  hostname: string;
}

export interface CPUInfo {
  model: string;
  speed: string;
  cores: number;
  threads: number;
  loadAvg: string;
  loadPercent: string;
  /** Raw CPU usage percentage (0–100) for sparklines/thresholds */
  loadRaw: number;
  arch: string;
  endianness: string;
}

export interface MemoryInfo {
  total: string;
  free: string;
  used: string;
  percent: string;
  usedRaw: number;
  totalRaw: number;
  /** Raw used percentage (0–100) for sparklines/thresholds */
  usedPercent: number;
}

export interface NetworkInterface {
  name: string;
  address: string;
  family: string;
  mac: string;
}

export interface NetworkInfo {
  inbound: string;
  outbound: string;
  /** Live download speed (bytes/sec, formatted) */
  rxSpeed: string;
  /** Live upload speed (bytes/sec, formatted) */
  txSpeed: string;
  rxSpeedRaw: number;
  txSpeedRaw: number;
  interfaces: NetworkInterface[];
}

export interface PartitionInfo {
  device?: string;
  mountpoint: string;
  fstype?: string;
  total: string;
  used: string;
  free: string;
  percent?: string;
}

export interface DiskInfo {
  partitions: PartitionInfo[];
  total: string;
  used: string;
  free: string;
  usedPercent?: number;
}

export interface BatteryInfo {
  supported: boolean;
  level: string;
  charging: string;
  timeRemaining: string;
}

export interface GPUInfo {
  model: string;
  driver: string;
  memory: string;
}

export interface ProcessInfo {
  pid: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: string;
  heapUsed: string;
  heapTotal: string;
  rss: string;
  external: string;
}

export interface TopProcess {
  pid: string;
  cpu: string;
  mem: string;
  name: string;
}

export interface SystemStats {
  timestamp: string;
  platform: PlatformInfo;
  cpu: CPUInfo;
  memory: MemoryInfo;
  network?: NetworkInfo;
  disk?: DiskInfo;
  battery?: BatteryInfo;
  gpu?: GPUInfo;
  process: ProcessInfo;
  topProcesses?: TopProcess[];
}

// ─── Options ──────────────────────────────────────────────────────

export interface AlertThresholds {
  /** CPU usage % that triggers an 'alert' event (default: 90) */
  cpu?: number;
  /** Memory usage % that triggers an 'alert' event (default: 85) */
  memory?: number;
  /** Disk usage % that triggers an 'alert' event (default: 90) */
  disk?: number;
}

export interface CrystalSystemOptions {
  /** Refresh interval in milliseconds. 0 = display once (default: 5000) */
  interval?: number;
  /** Clear console before each update (default: true) */
  clearConsole?: boolean;
  /** Enable ANSI colored output (default: true) */
  showColors?: boolean;
  /** Show network section (default: true) */
  showNetwork?: boolean;
  /** Show disk section (default: true) */
  showDisk?: boolean;
  /** Show battery section if supported (default: true) */
  showBattery?: boolean;
  /** Show GPU section if detectable (default: true) */
  showGPU?: boolean;
  /** Show top processes section (default: true) */
  showProcesses?: boolean;
  /** Path to write JSON log entries (optional) */
  logFile?: string | null;
  /** Port to start HTTP API server (optional) */
  httpPort?: number | null;
  /** Alert thresholds */
  thresholds?: AlertThresholds;
  /** Number of data points to retain for sparklines (default: 30) */
  historySize?: number;
}

// ─── Alert ───────────────────────────────────────────────────────

export interface AlertEvent {
  type: 'cpu' | 'memory' | 'disk';
  message: string;
  value: number;
  threshold: number;
}

// ─── Logger ──────────────────────────────────────────────────────

export interface Logger {
  write(stats: SystemStats): void;
  readAll(): SystemStats[];
}

// ─── CrystalSystem Class ─────────────────────────────────────────

export declare class CrystalSystem extends EventEmitter {
  options: Required<CrystalSystemOptions>;

  constructor(options?: CrystalSystemOptions);

  /** Start monitoring. Returns `this` for chaining. */
  start(): this;

  /** Stop monitoring and close HTTP server if running. */
  stop(): this;

  /** Display system info once immediately. */
  display(): void;

  /** Get a one-shot snapshot of all stats. */
  snapshot(): SystemStats;

  /** Update an alert threshold at runtime. */
  setThreshold(type: 'cpu' | 'memory' | 'disk', value: number): this;

  // EventEmitter overloads
  on(event: 'data',  listener: (stats: SystemStats) => void): this;
  on(event: 'alert', listener: (alert: AlertEvent)  => void): this;
  on(event: 'stop',  listener: () => void): this;

  emit(event: 'data',  stats: SystemStats): boolean;
  emit(event: 'alert', alert: AlertEvent):  boolean;
  emit(event: 'stop'):                      boolean;
}

// ─── Exports ─────────────────────────────────────────────────────

/**
 * Start system monitoring. Returns a running `CrystalSystem` instance.
 *
 * @example
 * const cs = crystalsystem({ interval: 3000 });
 * cs.on('alert', ({ message }) => console.error(message));
 * setTimeout(() => cs.stop(), 30000);
 */
export declare function crystalsystem(options?: CrystalSystemOptions): CrystalSystem;

/** Build the display table as a string without starting a monitor loop. */
export declare function buildSystemTable(options?: CrystalSystemOptions & {
  cpuHistory?: number[];
  memHistory?: number[];
}): string;

/** Get all stats in one call. */
export declare function getAllStats(options?: CrystalSystemOptions): SystemStats;

/** Start an HTTP API server independently. Returns Node's http.Server. */
export declare function startHttpServer(port?: number, options?: CrystalSystemOptions): Server;

/** Create a JSON-line file logger. */
export declare function createLogger(logFile: string): Logger;

/** Format bytes to a human-readable string. */
export declare function formatBytes(bytes: number, decimals?: number): string;

/** Generate a terminal sparkline string from a history array of percentages. */
export declare function sparkline(history: number[], maxWidth?: number): string;

export declare function getPlatformInfo(): PlatformInfo;
export declare function getCPUInfo(): CPUInfo;
export declare function getMemoryInfo(): MemoryInfo;
export declare function getNetworkInfo(): NetworkInfo;
export declare function getDiskInfo(): DiskInfo;
export declare function getBatteryInfo(): BatteryInfo;
export declare function getGPUInfo(): GPUInfo;
export declare function getProcessInfo(): ProcessInfo;
export declare function getTopProcesses(limit?: number): TopProcess[];

export default crystalsystem;

