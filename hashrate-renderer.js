(function () {
  'use strict';

  const el = (id) => document.getElementById(id);
  const hrEl = el('hr'), hrUnitEl = el('hr-unit'), sparkEl = el('spark');
  const tempEl = el('temp'), powerEl = el('power');
  const vramUsedEl = el('vram-used'), vramTotalEl = el('vram-total');
  const blockCountEl = el('block-count');
  const statusDot = el('status-dot'), statusLine = el('status-line');

  let hashHistory = new Array(30).fill(0);
  let blockCount = 0;

  function pushSpark(value) {
    hashHistory.push(value);
    hashHistory.shift();
    const max = Math.max(...hashHistory, 0.001);
    const points = hashHistory
      .map((v, i) => {
        const x = (i / (hashHistory.length - 1)) * 150;
        const y = 28 - (v / max) * 26;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    sparkEl.setAttribute('points', points);
  }

  const handlers = {
    'hashrate': (e) => {
      hrEl.textContent = e.value.toFixed(2);
      hrUnitEl.textContent = e.unit;
      pushSpark(e.value);
    },
    'gpu-stats': (e) => {
      if (e.temp !== undefined) tempEl.textContent = Math.round(e.temp);
      if (e.power !== undefined) powerEl.textContent = Math.round(e.power);
      if (e.vramUsed !== undefined && e.vramTotal !== undefined) {
        vramUsedEl.textContent = e.vramUsed.toFixed(1);
        vramTotalEl.textContent = e.vramTotal.toFixed(0);
      }
    },
    'block-found': () => {
      blockCount++;
      blockCountEl.textContent = blockCount;
    },
  };

  function handleEvent(e) {
    const fn = handlers[e.type];
    if (fn) fn(e);
  }

  window.keryx.onEvent(handleEvent);

  window.keryx.onStatus((s) => {
    if (s.running) {
      statusDot.classList.add('live');
      statusLine.classList.add('live');
      statusLine.textContent = 'mining';
    } else {
      statusDot.classList.remove('live');
      statusLine.classList.remove('live');
      statusLine.textContent = s.error ? `error: ${s.error}` : 'idle';
      hrEl.textContent = '0.00';
      tempEl.textContent = '--';
      powerEl.textContent = '--';
      vramUsedEl.textContent = '--';
      vramTotalEl.textContent = '--';
      hashHistory = new Array(30).fill(0);
      pushSpark(0);
    }
  });

  el('btn-min').addEventListener('click', () => window.keryx.minimize());
  el('btn-close').addEventListener('click', () => window.keryx.close());
})();
