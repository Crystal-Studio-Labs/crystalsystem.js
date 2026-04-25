//=================================================================
// crystalsystem.js — Web Dashboard (v1.1.0-alpha.1)
// Crystal Studio Labs | Author: SahooShuvranshu
// https://github.com/Crystal-Studio-Labs/crystalsystem.js
//
// Pure Node.js — zero extra dependencies.
// Uses built-in http module for WebSocket handshake.
// Serves the entire dashboard as an embedded HTML string.
//=================================================================

'use strict';

const http   = require('http');
const crypto = require('crypto');
const {
  getCPUInfo, getMemoryInfo, getNetworkInfo,
  getDiskInfo, getBatteryInfo, getGPUInfo,
  getPlatformInfo, getProcessInfo, getTopProcesses,
  formatBytes, sparkline,
} = require('./index.js');

// ─── Raw WebSocket implementation (no ws package) ────────────────

const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function wsHandshake(req, socket) {
  const key    = req.headers['sec-websocket-key'];
  const accept = crypto
    .createHash('sha1')
    .update(key + WS_MAGIC)
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
}

function wsSend(socket, data) {
  if (socket.destroyed) return;
  try {
    const payload = Buffer.from(JSON.stringify(data));
    const len     = payload.length;
    let header;

    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81;
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    socket.write(Buffer.concat([header, payload]));
  } catch {}
}

function wsClose(socket) {
  try {
    if (!socket.destroyed) {
      socket.write(Buffer.from([0x88, 0x00]));
      socket.destroy();
    }
  } catch {}
}

// ─── Dashboard HTML (embedded, single string) ────────────────────

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>crystalsystem.js — Live Dashboard</title>
<meta name="description" content="Live system monitor dashboard — crystalsystem.js by Crystal Studio Labs"/>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23080808'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='38' font-family='monospace' fill='%23FF2222'%3E❯%3C/text%3E%3C/svg%3E"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#FF2222;--red2:#cc1a1a;--red-g:rgba(255,34,34,.12);--red-f:rgba(255,34,34,.05);
  --bg:#070707;--bg1:#0d0d0d;--bg2:#121212;--bg3:#181818;
  --line:rgba(255,255,255,.06);--line-r:rgba(255,34,34,.15);
  --txt:#e4e4e4;--txt2:#888;--txt3:#444;
  --grn:#22cc66;--ylw:#ffcc22;--blu:#22aaff;--mgn:#cc66ff;
  --mono:'Share Tech Mono',monospace;--disp:'Syne',sans-serif;--body:'DM Sans',sans-serif;
}
html{font-size:16px;scroll-behavior:smooth}
body{background:var(--bg);color:var(--txt);font-family:var(--body);overflow-x:hidden;min-height:100vh}

/* Noise */
body::before{content:'';position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.2;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E")}

/* Scanlines */
body::after{content:'';position:fixed;inset:0;z-index:8999;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.02) 3px,rgba(0,0,0,.02) 4px)}

/* ── TOPBAR ── */
#topbar{
  position:sticky;top:0;z-index:100;
  height:52px;display:flex;align-items:center;justify-content:space-between;
  padding:0 24px;
  background:rgba(7,7,7,.95);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--line);
}
.tb-logo{font-family:var(--mono);font-size:13px;color:var(--red)}
.tb-logo span{color:var(--txt3)}
.tb-right{display:flex;align-items:center;gap:20px}
.tb-stat{font-family:var(--mono);font-size:11px;color:var(--txt3);display:flex;align-items:center;gap:6px}
.tb-stat strong{color:var(--txt)}
#ws-dot{width:7px;height:7px;border-radius:50%;background:#333;transition:background .3s}
#ws-dot.on{background:var(--grn);box-shadow:0 0 6px var(--grn)}
#ws-dot.err{background:var(--red)}

/* ── LAYOUT ── */
#app{
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  grid-template-rows:auto;
  gap:10px;
  padding:12px;
  max-width:1400px;
  margin:0 auto;
}

/* ── CARDS ── */
.card{
  background:var(--bg1);
  border:1px solid var(--line);
  padding:20px;
  position:relative;
  overflow:hidden;
  transition:border-color .2s;
}
.card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .3s;
}
.card:hover{border-color:var(--line-r)}
.card:hover::before{transform:scaleX(1)}

/* Card span helpers */
.span2{grid-column:span 2}
.span3{grid-column:span 3}

.card-label{
  font-family:var(--mono);font-size:9px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--txt3);margin-bottom:14px;
  display:flex;align-items:center;justify-content:space-between;
}
.card-label .icon{font-size:14px}

.card-value{
  font-family:var(--disp);font-size:clamp(28px,4vw,44px);
  font-weight:800;letter-spacing:-.03em;line-height:1;
  margin-bottom:6px;
}
.card-sub{font-family:var(--mono);font-size:11px;color:var(--txt2)}

/* ── GAUGE ── */
.gauge-wrap{position:relative;width:120px;height:120px;margin:8px auto 12px}
.gauge-svg{width:100%;height:100%;transform:rotate(-90deg)}
.gauge-bg{fill:none;stroke:var(--bg3);stroke-width:8}
.gauge-fill{fill:none;stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .6s cubic-bezier(.4,0,.2,1),stroke .3s}
.gauge-text{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  font-family:var(--disp);font-weight:800;font-size:22px;letter-spacing:-.02em;
}
.gauge-text small{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.15em;margin-top:2px}

/* ── BAR ── */
.bar-wrap{margin:10px 0 4px}
.bar-track{
  height:6px;background:var(--bg3);border-radius:0;overflow:hidden;
  position:relative;
}
.bar-fill{
  height:100%;border-radius:0;
  transition:width .6s cubic-bezier(.4,0,.2,1),background .3s;
}
.bar-labels{display:flex;justify-content:space-between;margin-top:5px}
.bar-labels span{font-family:var(--mono);font-size:10px;color:var(--txt3)}
.bar-labels strong{font-family:var(--mono);font-size:10px;color:var(--txt)}

/* ── CHART ── */
.chart-wrap{position:relative;height:70px;margin-top:10px}
canvas.chart{width:100%;height:100%;display:block}

/* ── STAT ROW ── */
.stat-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}
.stat-row:last-child{border-bottom:none}
.stat-key{font-family:var(--mono);font-size:11px;color:var(--txt2)}
.stat-val{font-family:var(--mono);font-size:11px;color:var(--txt);text-align:right}
.stat-val.red{color:var(--red)}
.stat-val.grn{color:var(--grn)}
.stat-val.ylw{color:var(--ylw)}
.stat-val.blu{color:var(--blu)}

/* ── PROCESS TABLE ── */
.proc-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
.proc-table th{
  font-family:var(--mono);font-size:9px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--txt3);text-align:left;padding:6px 8px;
  border-bottom:1px solid var(--line-r);
}
.proc-table td{
  padding:7px 8px;color:var(--txt2);border-bottom:1px solid var(--line);
  font-family:var(--mono);font-size:11px;
  transition:background .15s;
}
.proc-table tr:hover td{background:var(--bg2)}
.proc-table td:first-child{color:var(--txt3);font-size:10px}
.proc-table td:nth-child(2){color:var(--txt);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.proc-table td.cpu-val{color:var(--ylw)}
.proc-table td.mem-val{color:var(--blu)}

/* ── ALERT LOG ── */
.alert-list{margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto}
.alert-list::-webkit-scrollbar{width:3px}
.alert-list::-webkit-scrollbar-track{background:transparent}
.alert-list::-webkit-scrollbar-thumb{background:var(--line-r)}
.alert-item{
  background:var(--bg2);border:1px solid var(--line);border-left:3px solid var(--red);
  padding:8px 12px;display:flex;gap:10px;align-items:flex-start;
}
.alert-item.grn{border-left-color:var(--grn)}
.alert-item.ylw{border-left-color:var(--ylw)}
.alert-time{font-family:var(--mono);font-size:9px;color:var(--txt3);flex-shrink:0;margin-top:2px}
.alert-msg{font-family:var(--mono);font-size:11px;color:var(--txt2)}
.alert-msg strong{color:var(--txt);display:block;margin-bottom:2px}
.alert-empty{font-family:var(--mono);font-size:11px;color:var(--txt3);text-align:center;padding:24px 0}

/* ── PLATFORM CARD ── */
.platform-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;
}
.plat-item{background:var(--bg2);border:1px solid var(--line);padding:10px 12px}
.plat-key{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.plat-val{font-family:var(--mono);font-size:12px;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── NET SPEED ── */
.net-speeds{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.net-speed-item{text-align:center}
.net-speed-arrow{font-size:18px;margin-bottom:4px}
.net-speed-val{font-family:var(--disp);font-size:20px;font-weight:800;letter-spacing:-.02em}
.net-speed-label{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.15em;text-transform:uppercase;margin-top:3px}

/* ── BATTERY ── */
.batt-body{
  width:60px;height:28px;border:2px solid var(--txt3);border-radius:4px;
  position:relative;margin:12px auto 8px;
}
.batt-body::after{
  content:'';position:absolute;right:-7px;top:50%;transform:translateY(-50%);
  width:5px;height:12px;background:var(--txt3);border-radius:0 2px 2px 0;
}
.batt-fill{
  position:absolute;left:2px;top:2px;bottom:2px;border-radius:2px;
  transition:width .6s,background .3s;
}
.batt-pct{font-family:var(--disp);font-size:28px;font-weight:800;text-align:center;margin-top:4px}
.batt-status{font-family:var(--mono);font-size:10px;color:var(--txt3);text-align:center;letter-spacing:.1em;text-transform:uppercase}

/* ── UPTIME TICKER ── */
#uptime-val{font-family:var(--mono);font-size:clamp(18px,2.5vw,28px);color:var(--grn)}

/* ── REFRESH BADGE ── */
.refresh-badge{
  display:inline-flex;align-items:center;gap:5px;
  font-family:var(--mono);font-size:9px;color:var(--txt3);
  padding:3px 8px;background:var(--bg3);border:1px solid var(--line);
}
.refresh-dot{width:5px;height:5px;border-radius:50%;background:var(--grn);animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}

/* ── ANIMATIONS ── */
.card{animation:cardIn .5s cubic-bezier(.25,.46,.45,.94) both}
@keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* Stagger cards */
.card:nth-child(1){animation-delay:.05s}
.card:nth-child(2){animation-delay:.1s}
.card:nth-child(3){animation-delay:.15s}
.card:nth-child(4){animation-delay:.2s}
.card:nth-child(5){animation-delay:.25s}
.card:nth-child(6){animation-delay:.3s}
.card:nth-child(7){animation-delay:.35s}
.card:nth-child(8){animation-delay:.4s}
.card:nth-child(9){animation-delay:.45s}
.card:nth-child(10){animation-delay:.5s}
.card:nth-child(11){animation-delay:.55s}

/* ── FOOTER ── */
#footer{
  text-align:center;padding:20px;
  font-family:var(--mono);font-size:10px;color:var(--txt3);
  border-top:1px solid var(--line);letter-spacing:.08em;
}
#footer a{color:var(--red);text-decoration:none}
#footer a:hover{text-decoration:underline}

/* ── RESPONSIVE ── */
@media(max-width:1100px){
  #app{grid-template-columns:1fr 1fr}
  .span3{grid-column:span 2}
}
@media(max-width:700px){
  #app{grid-template-columns:1fr;padding:8px;gap:8px}
  .span2,.span3{grid-column:span 1}
  #topbar{padding:0 14px}
  .platform-grid{grid-template-columns:1fr}
  .net-speeds{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- TOPBAR -->
<div id="topbar">
  <div class="tb-logo"><span>❯ </span>crystalsystem.js <span style="color:var(--txt3);font-size:10px">v1.1.0-alpha.1</span></div>
  <div class="tb-right">
    <div class="tb-stat"><div id="ws-dot"></div> <span id="ws-status">connecting</span></div>
    <div class="tb-stat">updated <strong id="last-update">—</strong></div>
    <div class="refresh-badge"><span class="refresh-dot"></span> live</div>
  </div>
</div>

<!-- DASHBOARD GRID -->
<div id="app">

  <!-- CPU Gauge -->
  <div class="card" id="card-cpu">
    <div class="card-label"><span>⚙️ CPU Usage</span><span class="icon" id="cpu-model-short"></span></div>
    <div class="gauge-wrap">
      <svg class="gauge-svg" viewBox="0 0 120 120">
        <circle class="gauge-bg" cx="60" cy="60" r="52"/>
        <circle class="gauge-fill" id="cpu-gauge-fill" cx="60" cy="60" r="52"
          stroke-dasharray="326.7" stroke-dashoffset="326.7" stroke="var(--grn)"/>
      </svg>
      <div class="gauge-text"><span id="cpu-pct">0%</span><small>CPU</small></div>
    </div>
    <div class="stat-row"><span class="stat-key">Model</span><span class="stat-val" id="cpu-model">—</span></div>
    <div class="stat-row"><span class="stat-key">Cores</span><span class="stat-val" id="cpu-cores">—</span></div>
    <div class="stat-row"><span class="stat-key">Speed</span><span class="stat-val" id="cpu-speed">—</span></div>
    <div class="stat-row"><span class="stat-key">Load Avg</span><span class="stat-val" id="cpu-load">—</span></div>
    <div class="chart-wrap"><canvas id="cpu-chart" class="chart"></canvas></div>
  </div>

  <!-- Memory Gauge -->
  <div class="card" id="card-mem">
    <div class="card-label"><span>🧠 Memory</span></div>
    <div class="gauge-wrap">
      <svg class="gauge-svg" viewBox="0 0 120 120">
        <circle class="gauge-bg" cx="60" cy="60" r="52"/>
        <circle class="gauge-fill" id="mem-gauge-fill" cx="60" cy="60" r="52"
          stroke-dasharray="326.7" stroke-dashoffset="326.7" stroke="var(--blu)"/>
      </svg>
      <div class="gauge-text"><span id="mem-pct">0%</span><small>RAM</small></div>
    </div>
    <div class="stat-row"><span class="stat-key">Total</span><span class="stat-val" id="mem-total">—</span></div>
    <div class="stat-row"><span class="stat-key">Used</span><span class="stat-val blu" id="mem-used">—</span></div>
    <div class="stat-row"><span class="stat-key">Free</span><span class="stat-val grn" id="mem-free">—</span></div>
    <div class="chart-wrap"><canvas id="mem-chart" class="chart"></canvas></div>
  </div>

  <!-- Platform / Uptime -->
  <div class="card" id="card-plat">
    <div class="card-label"><span>🖥️ Platform</span></div>
    <div class="platform-grid">
      <div class="plat-item"><div class="plat-key">OS</div><div class="plat-val" id="plat-os">—</div></div>
      <div class="plat-item"><div class="plat-key">Arch</div><div class="plat-val" id="plat-arch">—</div></div>
      <div class="plat-item"><div class="plat-key">Hostname</div><div class="plat-val" id="plat-host">—</div></div>
      <div class="plat-item"><div class="plat-key">Node.js</div><div class="plat-val" id="plat-node">—</div></div>
      <div class="plat-item"><div class="plat-key">PID</div><div class="plat-val" id="plat-pid">—</div></div>
      <div class="plat-item"><div class="plat-key">Heap Used</div><div class="plat-val" id="plat-heap">—</div></div>
    </div>
    <div style="margin-top:14px">
      <div class="plat-key" style="margin-bottom:6px">System Uptime</div>
      <div id="uptime-val">—</div>
    </div>
  </div>

  <!-- Network -->
  <div class="card span2" id="card-net">
    <div class="card-label"><span>📡 Network</span></div>
    <div class="net-speeds">
      <div class="net-speed-item">
        <div class="net-speed-arrow" style="color:var(--grn)">↓</div>
        <div class="net-speed-val" id="net-rx" style="color:var(--grn)">0 B/s</div>
        <div class="net-speed-label">Download</div>
        <div class="stat-val grn" style="margin-top:6px;font-family:var(--mono);font-size:11px" id="net-rx-total">—</div>
      </div>
      <div class="net-speed-item">
        <div class="net-speed-arrow" style="color:var(--blu)">↑</div>
        <div class="net-speed-val" id="net-tx" style="color:var(--blu)">0 B/s</div>
        <div class="net-speed-label">Upload</div>
        <div class="stat-val blu" style="margin-top:6px;font-family:var(--mono);font-size:11px" id="net-tx-total">—</div>
      </div>
    </div>
    <div class="chart-wrap" style="height:80px;margin-top:14px"><canvas id="net-chart" class="chart"></canvas></div>
    <div style="margin-top:10px" id="net-ifaces"></div>
  </div>

  <!-- Disk -->
  <div class="card" id="card-disk">
    <div class="card-label"><span>💽 Disk</span></div>
    <div style="margin-top:4px" id="disk-content">
      <div class="stat-row"><span class="stat-key">Total</span><span class="stat-val" id="disk-total">—</span></div>
      <div class="stat-row"><span class="stat-key">Used</span><span class="stat-val ylw" id="disk-used">—</span></div>
      <div class="stat-row"><span class="stat-key">Free</span><span class="stat-val grn" id="disk-free">—</span></div>
      <div class="bar-wrap">
        <div class="bar-track"><div class="bar-fill" id="disk-bar" style="width:0%"></div></div>
        <div class="bar-labels"><span>0%</span><strong id="disk-pct">—</strong></div>
      </div>
    </div>
  </div>

  <!-- Battery -->
  <div class="card" id="card-batt">
    <div class="card-label"><span>🔋 Battery</span></div>
    <div class="batt-body"><div class="batt-fill" id="batt-fill"></div></div>
    <div class="batt-pct" id="batt-pct">—</div>
    <div class="batt-status" id="batt-status">—</div>
  </div>

  <!-- GPU -->
  <div class="card" id="card-gpu">
    <div class="card-label"><span>🎮 GPU</span></div>
    <div style="margin-top:8px">
      <div class="stat-row"><span class="stat-key">Model</span><span class="stat-val" id="gpu-model">—</span></div>
      <div class="stat-row"><span class="stat-key">Driver</span><span class="stat-val" id="gpu-driver">—</span></div>
    </div>
  </div>

  <!-- Process Info -->
  <div class="card" id="card-proc">
    <div class="card-label"><span>⚙️ This Process</span></div>
    <div class="stat-row"><span class="stat-key">PID</span><span class="stat-val" id="p-pid">—</span></div>
    <div class="stat-row"><span class="stat-key">Uptime</span><span class="stat-val grn" id="p-up">—</span></div>
    <div class="stat-row"><span class="stat-key">Heap Used</span><span class="stat-val" id="p-heap">—</span></div>
    <div class="stat-row"><span class="stat-key">Heap Total</span><span class="stat-val" id="p-heapt">—</span></div>
    <div class="stat-row"><span class="stat-key">RSS</span><span class="stat-val" id="p-rss">—</span></div>
    <div class="stat-row"><span class="stat-key">External</span><span class="stat-val" id="p-ext">—</span></div>
  </div>

  <!-- Top Processes -->
  <div class="card span2" id="card-top">
    <div class="card-label"><span>🔝 Top Processes</span><span style="font-family:var(--mono);font-size:9px">sorted by memory</span></div>
    <table class="proc-table">
      <thead>
        <tr><th>PID</th><th>Name</th><th>CPU</th><th>Memory</th></tr>
      </thead>
      <tbody id="proc-body"></tbody>
    </table>
  </div>

  <!-- Alert Log -->
  <div class="card span3" id="card-alerts">
    <div class="card-label">
      <span>🔔 Alert Log</span>
      <button onclick="clearAlerts()" style="font-family:var(--mono);font-size:9px;background:none;border:1px solid var(--line);color:var(--txt3);padding:3px 8px;cursor:pointer;letter-spacing:.1em;text-transform:uppercase">clear</button>
    </div>
    <div class="alert-list" id="alert-list">
      <div class="alert-empty">No alerts yet. Thresholds will appear here.</div>
    </div>
  </div>

</div>

<div id="footer">
  crystalsystem.js v1.1.0-alpha.1 &nbsp;·&nbsp;
  <a href="https://github.com/Crystal-Studio-Labs/crystalsystem.js" target="_blank">GitHub</a> &nbsp;·&nbsp;
  <a href="https://www.npmjs.com/package/@crystal-studio-labs/crystalsystem.js" target="_blank">npm</a> &nbsp;·&nbsp;
  Crystal Studio Labs · SahooShuvranshu
</div>

<script>
// ── Chart engine (pure canvas, no Chart.js) ──────────────────────
const HISTORY = 40;

function makeChart(canvasId, color, fillColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { push: () => {} };
  const ctx    = canvas.getContext('2d');
  const data   = [];

  function draw() {
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, W, H);
    if (data.length < 2) return;

    const max  = Math.max(...data, 1);
    const pts  = data.map((v, i) => ({
      x: (i / (HISTORY - 1)) * W,
      y: H - (v / max) * (H - 6) - 3,
    }));

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  return {
    push(val) {
      data.push(Number(val) || 0);
      if (data.length > HISTORY) data.shift();
      draw();
    },
    redraw: draw,
  };
}

const cpuChart = makeChart('cpu-chart', '#22cc66', 'rgba(34,204,102,.15)');
const memChart = makeChart('mem-chart', '#22aaff', 'rgba(34,170,255,.15)');
const netChart = makeChart('net-chart', '#cc66ff', 'rgba(204,102,255,.1)');

window.addEventListener('resize', () => {
  cpuChart.redraw(); memChart.redraw(); netChart.redraw();
});

// ── Gauge updater ─────────────────────────────────────────────────
const CIRC = 326.7;

function setGauge(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = CIRC - (pct / 100) * CIRC;
  el.style.strokeDashoffset = Math.max(0, Math.min(CIRC, offset));
  el.style.stroke = pct > 80 ? '#FF2222' : pct > 55 ? '#ffcc22' : pct > 30 ? '#22aaff' : '#22cc66';
}

// ── Bar updater ───────────────────────────────────────────────────
function setBar(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = pct + '%';
  el.style.background = pct > 80 ? '#FF2222' : pct > 55 ? '#ffcc22' : '#22cc66';
}

// ── Text updater ─────────────────────────────────────────────────
function set(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}

// ── Alert log ─────────────────────────────────────────────────────
const alerts = [];
function addAlert(type, msg, severity) {
  const now   = new Date().toLocaleTimeString();
  const item  = { type, msg, severity, time: now };
  alerts.unshift(item);
  if (alerts.length > 50) alerts.pop();
  renderAlerts();
}
function renderAlerts() {
  const list = document.getElementById('alert-list');
  if (!alerts.length) {
    list.innerHTML = '<div class="alert-empty">No alerts yet. Thresholds will appear here.</div>';
    return;
  }
  list.innerHTML = alerts.map(a => \`
    <div class="alert-item \${a.severity === 'cpu' ? '' : a.severity === 'disk' ? 'ylw' : 'grn'}">
      <span class="alert-time">\${a.time}</span>
      <div class="alert-msg">
        <strong>[\${a.type.toUpperCase()}] \${a.severity}</strong>
        \${a.msg}
      </div>
    </div>
  \`).join('');
}
function clearAlerts() {
  alerts.length = 0;
  renderAlerts();
}

// ── Uptime ticker ─────────────────────────────────────────────────
let sysUptimeBase = 0;
let tickerStart   = Date.now();

function formatUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (d) return \`\${d}d \${h}h \${m}m \${sec}s\`;
  if (h) return \`\${h}h \${m}m \${sec}s\`;
  return \`\${m}m \${sec}s\`;
}

setInterval(() => {
  if (!sysUptimeBase) return;
  const elapsed = (Date.now() - tickerStart) / 1000;
  set('uptime-val', formatUptime(sysUptimeBase + elapsed));
}, 1000);

// ── Apply full stats object ───────────────────────────────────────
function applyStats(s) {
  // Platform
  if (s.platform) {
    set('plat-os',   \`\${s.platform.platformName} \${s.platform.release}\`);
    set('plat-arch', s.platform.arch);
    set('plat-host', s.platform.hostname);
  }
  if (s.process) {
    set('plat-node', s.process.nodeVersion);
    set('plat-pid',  s.process.pid);
    set('plat-heap', s.process.heapUsed);
    set('p-pid',     s.process.pid);
    set('p-up',      s.process.uptime);
    set('p-heap',    s.process.heapUsed);
    set('p-heapt',   s.process.heapTotal);
    set('p-rss',     s.process.rss);
    set('p-ext',     s.process.external);
  }

  // CPU
  if (s.cpu) {
    const pct = s.cpu.loadRaw || 0;
    set('cpu-pct',   \`\${pct}%\`);
    set('cpu-model', s.cpu.model);
    set('cpu-model-short', s.cpu.model.substring(0, 8) + '…');
    set('cpu-cores', \`\${s.cpu.cores} threads\`);
    set('cpu-speed', s.cpu.speed);
    set('cpu-load',  s.cpu.loadAvg);
    setGauge('cpu-gauge-fill', pct);
    cpuChart.push(pct);
  }

  // Memory
  if (s.memory) {
    const pct = s.memory.usedPercent || 0;
    set('mem-pct',   \`\${pct}%\`);
    set('mem-total', s.memory.total);
    set('mem-used',  s.memory.used);
    set('mem-free',  s.memory.free);
    setGauge('mem-gauge-fill', pct);
    memChart.push(pct);
  }

  // Network
  if (s.network) {
    set('net-rx',       s.network.rxSpeed);
    set('net-tx',       s.network.txSpeed);
    set('net-rx-total', \`Total ↓ \${s.network.inbound}\`);
    set('net-tx-total', \`Total ↑ \${s.network.outbound}\`);
    netChart.push(s.network.rxSpeedRaw || 0);

    // Interfaces
    if (s.network.interfaces && s.network.interfaces.length) {
      document.getElementById('net-ifaces').innerHTML =
        s.network.interfaces.slice(0, 3).map(i =>
          \`<div class="stat-row">
            <span class="stat-key">\${i.name}</span>
            <span class="stat-val" style="font-size:10px">\${i.address} (\${i.family})</span>
          </div>\`
        ).join('');
    }
  }

  // Disk
  if (s.disk) {
    set('disk-total', s.disk.total);
    set('disk-used',  s.disk.used);
    set('disk-free',  s.disk.free);
    const pct = s.disk.usedPercent || 0;
    set('disk-pct', \`\${pct.toFixed(1)}%\`);
    setBar('disk-bar', pct);
    document.querySelector('#disk-content .bar-labels span').textContent = '0%';
  }

  // Battery
  if (s.battery) {
    if (s.battery.supported) {
      const lvl = parseInt(s.battery.level) || 0;
      set('batt-pct',    s.battery.level);
      set('batt-status', s.battery.charging === 'Yes' ? '⚡ Charging' : '🔋 Discharging');
      const fill = document.getElementById('batt-fill');
      fill.style.width      = lvl + '%';
      fill.style.background = lvl < 20 ? '#FF2222' : lvl < 50 ? '#ffcc22' : '#22cc66';
    } else {
      set('batt-pct',    'N/A');
      set('batt-status', 'not supported');
    }
  }

  // GPU
  if (s.gpu) {
    set('gpu-model',  s.gpu.model  || 'Not detected');
    set('gpu-driver', s.gpu.driver || 'N/A');
  }

  // Top Processes
  if (s.topProcesses && s.topProcesses.length) {
    document.getElementById('proc-body').innerHTML =
      s.topProcesses.map(p => \`
        <tr>
          <td>\${p.pid}</td>
          <td>\${p.name}</td>
          <td class="cpu-val">\${p.cpu}</td>
          <td class="mem-val">\${p.mem}</td>
        </tr>
      \`).join('');
  }

  // Uptime base
  if (s.uptimeSeconds !== undefined) {
    sysUptimeBase = s.uptimeSeconds;
    tickerStart   = Date.now();
  }

  // Alerts
  if (s.alert) {
    addAlert(s.alert.type, s.alert.message, s.alert.type);
  }

  // Timestamp
  set('last-update', new Date().toLocaleTimeString());
}

// ── WebSocket connection ─────────────────────────────────────────
const dot    = document.getElementById('ws-dot');
const status = document.getElementById('ws-status');
let ws, retryTimer, retryCount = 0;

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(\`\${proto}//\${location.host}\`);

  ws.onopen = () => {
    dot.className = 'on';
    status.textContent = 'connected';
    retryCount = 0;
  };

  ws.onmessage = e => {
    try { applyStats(JSON.parse(e.data)); } catch {}
  };

  ws.onclose = () => {
    dot.className = 'err';
    const delay = Math.min(30000, 2000 * Math.pow(1.5, retryCount++));
    status.textContent = \`reconnecting in \${Math.round(delay / 1000)}s...\`;
    retryTimer = setTimeout(connect, delay);
  };

  ws.onerror = () => {
    dot.className = 'err';
    status.textContent = 'error';
  };
}

connect();
</script>
</body>
</html>`;

// ─── Dashboard Server ────────────────────────────────────────────

function createDashboardServer(options = {}) {
  const {
    port          = 4000,
    interval      = 2000,
    thresholds    = { cpu: 80, memory: 75, disk: 85 },
    openBrowser   = true,
    onStats       = null,
  } = options;

  const clients = new Set();

  // ── HTTP server handles both page serve + WS upgrade ──────────
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', clients: clients.size }));
      return;
    }
    res.writeHead(200, {
      'Content-Type':                'text/html; charset=utf-8',
      'Cache-Control':               'no-cache',
      'X-Content-Type-Options':      'nosniff',
    });
    res.end(DASHBOARD_HTML);
  });

  // ── WebSocket upgrade ──────────────────────────────────────────
  server.on('upgrade', (req, socket) => {
    if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
      socket.destroy();
      return;
    }

    wsHandshake(req, socket);
    clients.add(socket);

    socket.on('error', () => {});
    socket.on('close', () => clients.delete(socket));
    socket.on('end',   () => clients.delete(socket));

    // Send initial snapshot immediately
    try {
      const snap = buildSnapshot(thresholds);
      wsSend(socket, snap);
    } catch {}
  });

  // ── Broadcast loop ─────────────────────────────────────────────
  let lastCpuRaw  = 0;
  let lastMemRaw  = 0;
  let lastDiskRaw = 0;

  const timer = setInterval(() => {
    if (!clients.size) return;

    try {
      const snap    = buildSnapshot(thresholds);
      const payload = { ...snap };

      // Check thresholds
      const cpuPct  = snap.cpu?.loadRaw || 0;
      const memPct  = snap.memory?.usedPercent || 0;
      const diskPct = snap.disk?.usedPercent || 0;

      if (cpuPct > thresholds.cpu && lastCpuRaw <= thresholds.cpu) {
        payload.alert = { type: 'cpu', message: `CPU usage critical: ${cpuPct.toFixed(1)}%` };
      } else if (memPct > thresholds.memory && lastMemRaw <= thresholds.memory) {
        payload.alert = { type: 'memory', message: `Memory usage high: ${memPct.toFixed(1)}%` };
      } else if (diskPct > thresholds.disk && lastDiskRaw <= thresholds.disk) {
        payload.alert = { type: 'disk', message: `Disk usage critical: ${diskPct.toFixed(1)}%` };
      }

      lastCpuRaw  = cpuPct;
      lastMemRaw  = memPct;
      lastDiskRaw = diskPct;

      if (onStats) onStats(snap);

      for (const socket of clients) {
        wsSend(socket, payload);
      }
    } catch {}
  }, interval);

  // ── Start ──────────────────────────────────────────────────────
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    process.stdout.write(
      `\n  \x1b[32m[CrystalSystem]\x1b[0m Dashboard running at \x1b[36m${url}\x1b[0m\n` +
      `  \x1b[2mPress Ctrl+C to stop.\x1b[0m\n\n`
    );

    if (openBrowser) {
      try {
        const { execSync } = require('child_process');
        const cmd = process.platform === 'darwin' ? `open ${url}`
          : process.platform === 'win32' ? `start ${url}`
          : `xdg-open ${url} 2>/dev/null || termux-open-url ${url} 2>/dev/null`;
        execSync(cmd, { stdio: 'ignore' });
      } catch {}
    }
  });

  // ── Cleanup ────────────────────────────────────────────────────
  function stop() {
    clearInterval(timer);
    for (const socket of clients) wsClose(socket);
    clients.clear();
    server.close();
  }

  process.on('SIGINT', () => { stop(); process.exit(0); });

  return { server, stop };
}

// ─── Snapshot builder ─────────────────────────────────────────────

function buildSnapshot() {
  const os = require('os');
  return {
    timestamp:    new Date().toISOString(),
    uptimeSeconds: os.uptime(),
    platform:     getPlatformInfo(),
    cpu:          getCPUInfo(),
    memory:       getMemoryInfo(),
    network:      getNetworkInfo(),
    disk:         getDiskInfo(),
    battery:      getBatteryInfo(),
    gpu:          getGPUInfo(),
    process:      getProcessInfo(),
    topProcesses: getTopProcesses(8),
  };
}

module.exports = { createDashboardServer };
