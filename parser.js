'use strict';

const PATTERNS = [
  {
    type: 'hashrate',
    re: /Current hashrate is ([\d.]+)\s+(\S+)/,
    map: (m) => ({ value: parseFloat(m[1]), unit: m[2] }),
  },
  {
    type: 'device-hashrate',
    re: /Device (.+?): ([\d.]+)\s+(\S+)/,
    map: (m) => ({ device: m[1], value: parseFloat(m[2]), unit: m[3] }),
  },
  {
    type: 'share-accepted',
    re: /Share accepted/,
    map: () => ({}),
  },
  {
    type: 'share-rejected',
    re: /Ignoring result for now/,
    map: () => ({}),
  },
  {
    type: 'block-found',
    re: /block submitted successfully!/,
    map: () => ({}),
  },
  {
    type: 'block-failed',
    re: /Failed submitting block: (.+)/,
    map: (m) => ({ reason: m[1] }),
  },
  // OPoI completion – triggers counter
  {
    type: 'opoi-complete',
    re: /OPoI: inference complete/,
    map: () => ({}),
  },
  // Fallback for older CID submit logs (kept for compatibility)
  {
    type: 'opoi-cid-submit',
    re: /OPoI.*submitting share.*CID/i,
    map: () => ({}),
  },
  {
    type: 'model-loading',
    re: /SlmEngine: (?:loading|loaded)\s+'(.+?)'/i,
    map: (m) => ({ model: m[1] }),
  },
  {
    type: 'model-ready',
    re: /SlmEngine: (?:'(.+?)'\s+(?:ready|loaded)|ready for\s+'(.+?)')/i,
    map: (m) => {
      const model = m[1] || m[2];
      return { model: model || 'unknown' };
    },
  },
  {
    type: 'model-evict',
    re: /SlmEngine: evicting '(.+?)' to load '(.+?)'/,
    map: (m) => ({ from: m[1], to: m[2] }),
  },
  {
    type: 'escrow-claim',
    re: /EscrowWatcher: claim accepted for coinbase=(\S+)/,
    map: (m) => ({ coinbase: m[1] }),
  },
  {
    type: 'gpu-ready',
    re: /GPU: (\d+)W PL, (\d+) MB VRAM.*ready for (.+)/,
    map: (m) => ({ watts: parseInt(m[1], 10), vramMb: parseInt(m[2], 10), tier: m[3] }),
  },
  {
    type: 'connected',
    re: /keryxd address: (\S+)/,
    map: (m) => ({ address: m[1] }),
  },
  {
    type: 'block-height',
    re: /Block height:\s+(\d+)/,
    map: (m) => ({ height: parseInt(m[1], 10) }),
  },
];

function levelOf(line) {
  if (/\bERROR\b/.test(line)) return 'error';
  if (/\bWARN\b/.test(line)) return 'warn';
  if (/\bDEBUG\b/.test(line)) return 'debug';
  return 'info';
}

function parseLine(rawLine) {
  const line = rawLine.replace(/\r$/, '');
  const events = [{ type: 'log', level: levelOf(line), text: line }];
  for (const p of PATTERNS) {
    const m = line.match(p.re);
    if (m) {
      events.push({ type: p.type, ...p.map(m) });
      break;
    }
  }
  return events;
}

module.exports = { parseLine };