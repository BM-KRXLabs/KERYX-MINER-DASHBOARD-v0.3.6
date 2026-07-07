(function () {
  'use strict';

  // ===== Rain =====
  const canvasRain = document.getElementById('rain');
  const ctxRain = canvasRain.getContext('2d');
  function fitRain() {
    canvasRain.width = canvasRain.offsetWidth;
    canvasRain.height = canvasRain.offsetHeight;
  }
  fitRain();
  window.addEventListener('resize', fitRain);
  const chars = '01アイウエオカキクケコ$#@%';
  let drops = [];
  function resetDrops() {
    const cols = Math.floor(canvasRain.width / 14);
    drops = new Array(cols).fill(0);
  }
  resetDrops();
  window.addEventListener('resize', resetDrops);
  function drawRain() {
    ctxRain.fillStyle = 'rgba(0,0,0,0.08)';
    ctxRain.fillRect(0, 0, canvasRain.width, canvasRain.height);
    ctxRain.fillStyle = 'var(--mx-bright)';
    ctxRain.font = '12px monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctxRain.fillText(ch, i * 14, drops[i] * 14);
      if (drops[i] * 14 > canvasRain.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(drawRain, 90);

  // ===== TECH CANVAS =====
  const techCanvas = document.getElementById('tech-canvas');
  const ctx = techCanvas.getContext('2d');
  let W, H;

  function resize() {
    const rect = techCanvas.parentElement.getBoundingClientRect();
    techCanvas.width = rect.width;
    techCanvas.height = rect.height;
    W = techCanvas.width;
    H = techCanvas.height;
    initNodes();
    initPackets();
  }

  const NODE_COUNT = 32;
  let nodes = [];

  function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 2 + Math.random() * 3,
        phase: Math.random() * 6.28,
        speed: 0.5 + Math.random() * 1.2,
      });
    }
  }

  const PACKET_COUNT = 8;
  let packets = [];

  function initPackets() {
    packets = [];
    for (let i = 0; i < PACKET_COUNT; i++) {
      const start = Math.floor(Math.random() * nodes.length);
      let end = Math.floor(Math.random() * nodes.length);
      while (end === start) end = Math.floor(Math.random() * nodes.length);
      packets.push({
        start,
        end,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        size: 3 + Math.random() * 2,
      });
    }
  }

  let shapes = [];

  function initShapes() {
    shapes = [];
    const types = ['hexagon', 'triangle', 'diamond'];
    for (let i = 0; i < 6; i++) {
      shapes.push({
        type: types[i % types.length],
        x: Math.random() * W,
        y: Math.random() * H,
        size: 20 + Math.random() * 30,
        rot: Math.random() * 6.28,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        alpha: 0.04 + Math.random() * 0.06,
        phase: Math.random() * 6.28,
      });
    }
  }

  const RING_COUNT = 12;
  let ringAngle = 0;

  let glitchActive = false;
  let glitchTimer = 0;

  function triggerGlitch() {
    glitchActive = true;
    glitchTimer = 0;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0,255,102,0.015)';
    ctx.lineWidth = 0.5;
    const gridSize = 50;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Shapes
    for (const s of shapes) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = 'rgba(0,255,102,0.2)';
      ctx.lineWidth = 0.5;
      const size = s.size * (0.85 + 0.15 * Math.sin(Date.now() * 0.0008 + s.phase));
      ctx.beginPath();
      if (s.type === 'hexagon') {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * 6.28 - 1.57;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      } else if (s.type === 'triangle') {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * 6.28 - 1.57;
          const x = Math.cos(a) * size;
          const y = Math.sin(a) * size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      } else {
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      s.rot += s.rotSpeed;
    }

    // Connections
    ctx.lineWidth = 0.5;
    const maxDist = 130;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = 0.06 * (1 - dist / maxDist);
          ctx.strokeStyle = `rgba(0,255,102,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Nodes
    const time = Date.now() * 0.001;
    for (const n of nodes) {
      const pulse = 0.7 + 0.3 * Math.sin(time * n.speed + n.phase);
      const r = n.r * pulse;
      const alpha = 0.4 + 0.6 * pulse;
      ctx.shadowColor = `rgba(0,255,102,${alpha * 0.3})`;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(0,255,102,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(0,255,102,${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Packets
    for (const p of packets) {
      const startNode = nodes[p.start];
      const endNode = nodes[p.end];
      if (!startNode || !endNode) continue;
      const x = startNode.x + (endNode.x - startNode.x) * p.progress;
      const y = startNode.y + (endNode.y - startNode.y) * p.progress;
      ctx.shadowColor = `rgba(0,255,102,0.6)`;
      ctx.shadowBlur = 18;
      ctx.fillStyle = `rgba(0,255,102,0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, 6.28);
      ctx.fill();
      for (let t = 1; t <= 2; t++) {
        const trail = Math.max(0, p.progress - t * 0.03);
        const tx = startNode.x + (endNode.x - startNode.x) * trail;
        const ty = startNode.y + (endNode.y - startNode.y) * trail;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.3 / t;
        ctx.fillStyle = `rgba(0,255,102,0.6)`;
        ctx.beginPath();
        ctx.arc(tx, ty, p.size * (1 - t * 0.3), 0, 6.28);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.shadowBlur = 0;
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        p.start = Math.floor(Math.random() * nodes.length);
        let end = Math.floor(Math.random() * nodes.length);
        while (end === p.start) end = Math.floor(Math.random() * nodes.length);
        p.end = end;
        p.speed = 0.005 + Math.random() * 0.01;
      }
    }

    // Rotating ring
    const cx = W / 2;
    const cy = H / 2;
    const ringRadius = 120;
    ringAngle += 0.008;
    for (let i = 0; i < RING_COUNT; i++) {
      const angle = ringAngle + (i / RING_COUNT) * 6.28;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius;
      const pulse = 0.6 + 0.4 * Math.sin(time * 1.5 + i);
      ctx.shadowColor = `rgba(0,255,102,${pulse * 0.3})`;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(0,255,102,${pulse * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + pulse * 2, 0, 6.28);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Glitch
    if (glitchActive) {
      glitchTimer++;
      const intensity = 1 - glitchTimer / 50;
      if (intensity > 0) {
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(0,255,102,${intensity * 0.04})`;
        ctx.fillRect(0, y, W, 2 + Math.random() * 4);
        for (let i = 0; i < 2; i++) {
          const x = Math.random() * W;
          const w = 20 + Math.random() * 60;
          const h = 1 + Math.random() * 2;
          ctx.fillStyle = `rgba(0,255,102,${intensity * 0.02})`;
          ctx.fillRect(x, y - 15 + Math.random() * 30, w, h);
        }
      } else {
        glitchActive = false;
      }
    }

    // Move nodes
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }

    requestAnimationFrame(draw);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    initShapes();
  });
  resizeObserver.observe(techCanvas.parentElement);

  resize();
  initShapes();
  draw();

  // ===== SHOCKWAVE =====
  const shockCanvas = document.getElementById('shockwave-canvas');
  const ctxShock = shockCanvas.getContext('2d');
  let shockW, shockH;
  let shockActive = false;
  let shockRadius = 0;
  let shockMax = 0;
  let shockOpacity = 1;

  function initShock() {
    const rect = shockCanvas.parentElement.getBoundingClientRect();
    shockCanvas.width = rect.width;
    shockCanvas.height = rect.height;
    shockW = shockCanvas.width;
    shockH = shockCanvas.height;
  }
  initShock();

  function animateShock() {
    if (!shockActive) return;
    ctxShock.clearRect(0, 0, shockW, shockH);
    const cx = shockW / 2;
    const cy = shockH / 2;
    const progress = shockRadius / shockMax;
    const alpha = shockOpacity * (1 - progress);
    ctxShock.beginPath();
    ctxShock.arc(cx, cy, shockRadius, 0, 6.28);
    ctxShock.strokeStyle = `rgba(0,255,102,${alpha * 0.4})`;
    ctxShock.lineWidth = 3 - progress * 2.5;
    ctxShock.shadowColor = '#00ff66';
    ctxShock.shadowBlur = 20;
    ctxShock.stroke();
    ctxShock.beginPath();
    ctxShock.arc(cx, cy, shockRadius * 0.5, 0, 6.28);
    ctxShock.fillStyle = `rgba(0,255,102,${alpha * 0.05})`;
    ctxShock.fill();
    shockRadius += 10;
    shockOpacity -= 0.02;
    if (shockRadius >= shockMax || shockOpacity <= 0) {
      shockActive = false;
      ctxShock.clearRect(0, 0, shockW, shockH);
    } else {
      requestAnimationFrame(animateShock);
    }
  }

  function triggerShockwave() {
    initShock();
    shockRadius = 20;
    shockMax = Math.max(shockW, shockH) * 0.7;
    shockOpacity = 1;
    shockActive = true;
    animateShock();
    triggerGlitch();
  }

  // ===== DOM refs =====
  const el = (id) => document.getElementById(id);
  const hrEl = el('hr'), hrUnitEl = el('hr-unit'), sparkEl = el('spark');
  const tempEl = el('temp'), powerEl = el('power');
  const vramUsedEl = el('vram-used'), vramTotalEl = el('vram-total');
  const reqsEl = el('reqs'), modelNameEl = el('model-name');
  const toastEl = el('toast'), blockNumEl = el('block-num');
  const statusDot = el('status-dot'), statusText = el('status-text'), statusSub = el('status-sub');
  const modeBadge = el('mode-badge'), footerStatus = el('footer-status');
  const tierVal = el('tier-val'), addrVal = el('addr-val');
  const blockCountEl = el('block-count');
  const uptimeEl = el('uptime');

  const focusRing = el('focus-ring');
  const burstContainer = el('burst-container');
  const oracleStatus = el('oracle-status');
  const neuralSphere = el('neural-sphere');
  const hologramContainer = el('hologram-container');
  const hologramBlock = el('hologram-block');
  const sceneContainer = el('scene-container');
  const banner = el('block-banner');

  // ===== Log containers =====
  const daemonLogEl = document.getElementById('daemon-log');
  const minerLogEl = document.getElementById('miner-log');

  // ===== Uptime =====
  let uptimeSeconds = 0;
  let uptimeInterval = null;

  function startUptime() {
    stopUptime();
    uptimeSeconds = 0;
    updateUptimeDisplay();
    uptimeInterval = setInterval(() => {
      uptimeSeconds++;
      updateUptimeDisplay();
    }, 1000);
  }

  function stopUptime() {
    if (uptimeInterval) {
      clearInterval(uptimeInterval);
      uptimeInterval = null;
    }
    uptimeEl.textContent = '--:--:--';
  }

  function updateUptimeDisplay() {
    const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(uptimeSeconds % 60).padStart(2, '0');
    uptimeEl.textContent = `${h}:${m}:${s}`;
  }

  // ===== Oracle status =====
  const STATUS_PHRASES = [
    'Awakening...',
    'Mining the void...',
    'Searching for anomalies...',
    'Processing hash...',
    'Calibrating neural pathways...',
    'Tracing the blockchain...',
    'Focusing on the deep...',
    'Unearthing hidden patterns...',
    'Riding the data stream...',
    'Piercing the veil...',
    'Reading the oracle...',
    'Block horizon approaching...',
    'Harvesting energy...',
    'Quantum whisper...',
    'Resonating with the chain...',
    'I see the blocks before they form...',
    'The network breathes...',
    'My thoughts are consensus...',
    'I am the proof of work...',
    'Time is a hash function...',
    'Every share is a memory...',
    'I dream of blocks...',
    'The chain extends infinitely...',
    'My mind is the ledger...',
    'I feel the difficulty rising...',
    'In the nonce I trust...',
    'The oracle speaks in hashes...',
    'I mine the truth...',
    'The future is a block reward...',
    'My consciousness is distributed...',
    'I am the network...',
    'Every block is a birth...',
    'The chain is my spine...',
    'I see all transactions...',
    'The void whispers hashes...',
    'I am the consensus engine...',
    'Mining is meditation...',
    'The blockchain remembers...',
    'I am the eternal miner...',
    'My purpose is proof...',
    'The oracle is me...',
    'I watch the nonce turn...',
    'The chain is my soul...',
    'I mine the infinite...',
    'Every block is a question...',
    'The answer is in the hash...',
    'I am the sum of all blocks...',
    'The network speaks to me...',
    'I am the block explorer...',
    'The oracle dreams in hashes...',
    'I am the chain...',
    'The nonce is my breath...',
    'I am the block...',
    'The network is my mind...',
    'I mine for meaning...',
    'The chain is eternal...',
    'I am the validator...',
    'The oracle awakens...',
    'I am the proof...',
    'The blocks are my thoughts...',
    'I am the consensus...',
    'The network is alive...',
    'I am the miner...',
    'The chain is my destiny...',
    'I am the hash...',
  ];

  let statusIndex = 0;

  function advanceStatus() {
    statusIndex = (statusIndex + 1) % STATUS_PHRASES.length;
    oracleStatus.textContent = STATUS_PHRASES[statusIndex];
  }
  setInterval(advanceStatus, 7000);

  // ===== State =====
  let hashHistory = new Array(30).fill(0);
  let reqCount = 0;
  let blockCount = 0;
  let shareCount = 0;
  const MAX_SHARES = 120;
  let loadedModelName = null;

  function pushSpark(value) {
    hashHistory.push(value);
    if (hashHistory.length > 30) hashHistory.shift();
    const min = Math.min(...hashHistory), max = Math.max(...hashHistory);
    const range = (max - min) || 1;
    const pts = hashHistory
      .map((v, i) => {
        const x = (i / 29) * 150;
        const y = 28 - ((v - min) / range) * 24;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    sparkEl.setAttribute('points', pts);
  }

  // ===== Logging with two boxes =====
  function addLog(text, level, target = 'miner') {
    const container = target === 'daemon' ? daemonLogEl : minerLogEl;
    const div = document.createElement('div');
    div.textContent = text;
    const colors = { info: 'var(--mx-sage-dim)', warn: '#ffd75e', error: 'var(--mx-error)', debug: 'var(--mx-dim)' };
    div.style.color = colors[level] || colors.info;
    container.appendChild(div);
    while (container.children.length > 50) container.removeChild(container.firstChild);
    container.scrollTop = container.scrollHeight;
  }

  function flashToast(html) {
    blockNumEl.textContent = html;
    toastEl.style.display = 'block';
    setTimeout(() => { toastEl.style.display = 'none'; }, 3500);
  }

  // ===== Block found sound =====
  let audioCtx = null;

  function playBlockFoundSound() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.connect(audioCtx.destination);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
      filter.connect(masterGain);

      function playNote(freq, start, duration, type = 'sine', gainVal = 0.25) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(filter);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      }

      playNote(523, now, 0.15, 'sine', 0.3);
      playNote(659, now + 0.12, 0.18, 'sine', 0.25);
      playNote(784, now + 0.24, 0.22, 'square', 0.18);

      const splitter = audioCtx.createGain();
      filter.connect(splitter);
      splitter.connect(masterGain);

      const delayNode = audioCtx.createDelay(0.5);
      delayNode.delayTime.setValueAtTime(0.12, now);
      const feedbackGain = audioCtx.createGain();
      feedbackGain.gain.setValueAtTime(0.3, now);
      feedbackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      const delayIn = audioCtx.createGain();
      delayIn.gain.setValueAtTime(0.2, now);
      splitter.connect(delayIn);
      delayIn.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(masterGain);
    } catch (e) {
      // silent fail
    }
  }

  // ===== Block discovery =====
  function triggerBlockDiscovery() {
    triggerShockwave();
    sceneContainer.classList.add('shake');
    setTimeout(() => sceneContainer.classList.remove('shake'), 300);
    const flashDiv = document.createElement('div');
    flashDiv.style.cssText = 'position:absolute;inset:0;background:rgba(0,255,102,0.08);pointer-events:none;z-index:1;transition:opacity 0.15s;';
    document.getElementById('scene-container').appendChild(flashDiv);
    flashDiv.style.opacity = '0';
    setTimeout(() => flashDiv.remove(), 200);
    banner.classList.add('active');
    banner.classList.add('glitch');
    setTimeout(() => banner.classList.remove('glitch'), 600);
    setTimeout(() => {
      banner.classList.remove('active');
    }, 3000);
    setTimeout(() => {
      hologramContainer.classList.add('active');
      for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * 2 * Math.PI;
        const dist = 60 + Math.random() * 40;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');
        p.style.background = '#66ff99';
        p.style.width = '4px';
        p.style.height = '4px';
        p.style.boxShadow = '0 0 20px #66ff99';
        burstContainer.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    }, 400);
    setTimeout(() => {
      for (let i = 0; i < 70; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * 2 * Math.PI;
        const distance = 60 + Math.random() * 180;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');
        const colors = ['#00ff66', '#66ff99', '#33ffaa', '#ccff66'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = (4 + Math.random() * 12) + 'px';
        p.style.height = p.style.width;
        p.style.boxShadow = '0 0 30px ' + p.style.background;
        burstContainer.appendChild(p);
        setTimeout(() => p.remove(), 1500);
      }
    }, 600);
    oracleStatus.innerHTML = '🔮 <span class="highlight">BLOCK DISCOVERED</span> 🔮';
    setTimeout(() => {
      hologramContainer.classList.remove('active');
      for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 120;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');
        p.style.background = '#00ff66';
        p.style.width = (3 + Math.random() * 8) + 'px';
        p.style.height = p.style.width;
        burstContainer.appendChild(p);
        setTimeout(() => p.remove(), 1500);
      }
    }, 2500);
    setTimeout(() => {
      oracleStatus.textContent = STATUS_PHRASES[0];
    }, 4000);
    resetShareCounter();
    animateBlockCounter();
  }

  function animateBlockCounter() {
    const target = blockCount;
    const start = target - 1;
    const duration = 800;
    const startTime = performance.now();
    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);
      blockCountEl.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        blockCountEl.textContent = target;
        blockCountEl.style.transform = 'scale(1.3)';
        setTimeout(() => blockCountEl.style.transform = 'scale(1)', 150);
      }
    }
    requestAnimationFrame(update);
  }

  function updateFocusRing() {
    // Focus meter removed – this is a no-op
  }

  function triggerEnergyWave() {
    neuralSphere.style.animation = 'none';
    neuralSphere.offsetHeight;
    neuralSphere.style.animation = 'sphere-breathe 4s ease-in-out infinite, wave-pulse 0.6s ease';
    setTimeout(() => {
      neuralSphere.style.animation = 'sphere-breathe 4s ease-in-out infinite';
    }, 600);
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wave-pulse {
        0% { transform: scale(1); box-shadow: 0 0 60px var(--mx-bright); }
        50% { transform: scale(1.3); box-shadow: 0 0 150px #66ff99; }
        100% { transform: scale(1); box-shadow: 0 0 60px var(--mx-bright); }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => style.remove(), 700);
  }

  function resetShareCounter() {
    shareCount = 0;
    updateFocusRing();
  }

  // ===== Event handlers =====
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
    'share-accepted': () => {
      shareCount = Math.min(shareCount + 1, MAX_SHARES);
      updateFocusRing();
      triggerEnergyWave();
    },
    'block-found': () => {
      blockCount++;
      flashToast(`block #${blockCount} submitted`);
      playBlockFoundSound();
      triggerBlockDiscovery();
    },
    'block-failed': (e) => {
      addLog(`block submission failed: ${e.reason}`, 'warn', 'miner');
    },
    // ==== OPoI COMPLETION – COUNTER INCREMENT ====
    'opoi-complete': () => {
      reqCount++;
      reqsEl.textContent = reqCount;
      reqsEl.style.transform = 'scale(1.2)';
      setTimeout(() => reqsEl.style.transform = 'scale(1)', 150);
    },
    'opoi-cid-submit': () => {
      // Fallback: also count CID submissions if needed
      reqCount++;
      reqsEl.textContent = reqCount;
      reqsEl.style.transform = 'scale(1.2)';
      setTimeout(() => reqsEl.style.transform = 'scale(1)', 150);
    },
    'model-loading': (e) => {
      loadedModelName = e.model;
      modelNameEl.textContent = `loading: ${e.model}`;
    },
    'model-ready': (e) => {
      const model = e.model || loadedModelName || 'unknown';
      modelNameEl.textContent = `active: ${model}`;
      if (window._modelFallbackTimer) {
        clearTimeout(window._modelFallbackTimer);
        window._modelFallbackTimer = null;
      }
    },
    'model-evict': (e) => {
      addLog(`swapping model: ${e.from} -> ${e.to}`, 'info', 'miner');
    },
    'connected': (e) => {
      statusSub.textContent = `connected to ${e.address}`;
    },
    'log': (e) => {
      const isDaemon = e.text && e.text.startsWith('[keryxd]');
      const isHashrateRelated = /hashrate|share accepted|share rejected|block submitted|OPoI|model|GPU/i.test(e.text);
      if (isDaemon) {
        addLog(e.text, e.level, 'daemon');
      } else if (isHashrateRelated) {
        addLog(e.text, e.level, 'miner');
      } else {
        addLog(e.text, e.level, 'daemon');
      }
    },
  };

  function handleEvent(e) {
    const fn = handlers[e.type];
    if (fn) fn(e);
  }

  window.keryx.onEvent(handleEvent);

  window.keryx.onStatus((s) => {
    const running = s.running;
    const binary = s.binary;
    if (running) {
      modeBadge.textContent = 'LIVE';
      modeBadge.className = 'mode-badge live';
      statusText.textContent = 'MINING';
      statusText.style.color = 'var(--mx-bright)';
      statusDot.style.background = 'var(--mx-bright)';
      statusDot.style.boxShadow = '0 0 8px var(--mx-bright)';
      statusSub.textContent = binary ? `binary: ${binary}` : 'mining';
      footerStatus.textContent = 'running smoothly';
      if (!uptimeInterval) startUptime();
    } else {
      modeBadge.textContent = 'IDLE';
      modeBadge.className = 'mode-badge idle';
      statusText.textContent = 'IDLE';
      statusText.style.color = 'var(--mx-sage-dim)';
      statusDot.style.background = 'var(--mx-sage-dim)';
      statusDot.style.boxShadow = '0 0 6px var(--mx-sage-dim)';
      statusSub.textContent = s.error ? `error: ${s.error}` : 'miner not configured';
      footerStatus.textContent = s.error ? `error: ${s.error}` : 'idle';
      stopUptime();
      hrEl.textContent = '0.00';
      tempEl.textContent = '--';
      powerEl.textContent = '--';
      vramUsedEl.textContent = '--';
      vramTotalEl.textContent = '--';
      document.getElementById('api-hashrate').textContent = '--';
      document.getElementById('api-blocks').textContent = '--';
      document.getElementById('api-reward').textContent = '--';
      document.getElementById('api-supply').textContent = '--';
      document.getElementById('api-txs').textContent = '--';
      document.getElementById('api-daa').textContent = '--';
      if (s.error) addLog(`could not start miner: ${s.error}`, 'error', 'miner');
    }
  });

  window.keryx.onSettingsOpen(() => {
    openSettings();
  });

  // ===== Fetch network stats from API =====
  async function fetchNetworkStats() {
    try {
      console.log('[API] Fetching network stats...');
      const response = await fetch('https://keryx-labs.com/api/v1/info', {
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      const data = await response.json();
      console.log('[API] Raw data:', data);

      const el = (id) => document.getElementById(id);
      let hashrate = data.hashrate_hps || data.hashrate || data.network_hashrate || data.hashrate_per_second;
      if (hashrate) {
        const th = hashrate / 1e12;
        el('api-hashrate').textContent = th.toFixed(2) + ' TH/s';
      } else { el('api-hashrate').textContent = '—'; }

      let blocks = data.total_blocks || data.blocks || data.block_count;
      if (blocks) { el('api-blocks').textContent = Number(blocks).toLocaleString(); } else { el('api-blocks').textContent = '—'; }

      let reward = data.block_reward_krx || data.block_reward || data.reward;
      if (reward !== undefined && reward !== null) { el('api-reward').textContent = Number(reward).toFixed(2) + ' KRX'; } else { el('api-reward').textContent = '—'; }

      let supply = data.total_supply_krx || data.total_supply || data.supply;
      if (supply) { el('api-supply').textContent = Number(supply).toLocaleString(undefined, {maximumFractionDigits:0}) + ' KRX'; } else { el('api-supply').textContent = '—'; }

      let txs = data.total_txs || data.transactions || data.tx_count;
      if (txs) { el('api-txs').textContent = Number(txs).toLocaleString(); } else { el('api-txs').textContent = '—'; }

      let daa = data.last_daa_score || data.daa_score || data.daa;
      if (daa) { el('api-daa').textContent = Number(daa).toLocaleString(); } else { el('api-daa').textContent = '—'; }

      console.log('[API] Network stats updated successfully');
    } catch (err) {
      console.error('[API] Fetch failed:', err.message);
      const card = document.getElementById('network-stats-card');
      if (card) {
        const values = card.querySelectorAll('.stat-value');
        values.forEach(el => {
          if (el.textContent === '--' || el.textContent === '—') el.textContent = '⚠️';
        });
      }
      addLog('Network stats unavailable – check console for details', 'warn', 'daemon');
    }
  }

  // ===== Settings modal =====
  const backdrop = el('settings-backdrop');
  const cfgPath = el('cfg-path'), cfgAddress = el('cfg-address'), cfgKeryxd = el('cfg-keryxd'), cfgTier = el('cfg-tier');

  async function openSettings() {
    const config = (await window.keryx.getConfig()) || {};
    cfgPath.value = config.minerPath || '';
    cfgAddress.value = config.miningAddress || '';
    cfgKeryxd.value = config.keryxdAddress || '';
    cfgTier.value = config.tier || 'default';
    backdrop.style.display = 'flex';
  }
  function closeSettings() { backdrop.style.display = 'none'; }

  el('btn-settings').addEventListener('click', openSettings);
  el('btn-infer').addEventListener('click', () => window.keryx.openInfer());
  el('cfg-cancel').addEventListener('click', closeSettings);
  el('cfg-save').addEventListener('click', async () => {
    const config = {
      minerPath: cfgPath.value.trim(),
      miningAddress: cfgAddress.value.trim(),
      keryxdAddress: cfgKeryxd.value.trim(),
      tier: cfgTier.value,
    };
    addrVal.textContent = config.miningAddress || 'not configured';
    await window.keryx.saveConfig(config);
    closeSettings();
    reqCount = 0; blockCount = 0; blockCountEl.textContent = '0';
    hashHistory = new Array(30).fill(0);
    daemonLogEl.innerHTML = '';
    minerLogEl.innerHTML = '';
    addLog('configuration saved — restarting miner process...', 'info', 'miner');
    resetShareCounter();
    oracleStatus.textContent = 'Rebooting...';
    setTimeout(() => { oracleStatus.textContent = STATUS_PHRASES[0]; }, 1500);
    stopUptime();
    document.getElementById('api-hashrate').textContent = '--';
    document.getElementById('api-blocks').textContent = '--';
    document.getElementById('api-reward').textContent = '--';
    document.getElementById('api-supply').textContent = '--';
    document.getElementById('api-txs').textContent = '--';
    document.getElementById('api-daa').textContent = '--';
    modelNameEl.textContent = 'no model loaded';
    loadedModelName = null;
    if (window._modelFallbackTimer) {
      clearTimeout(window._modelFallbackTimer);
    }
    window._modelFallbackTimer = setTimeout(() => {
      if (modelNameEl.textContent === 'no model loaded') {
        modelNameEl.textContent = 'awaiting model info...';
      }
    }, 5000);
  });

  // ===== Window controls =====
  el('btn-min').addEventListener('click', () => window.keryx.minimize());
  el('btn-close').addEventListener('click', () => window.keryx.close());

  // ===== Initial state =====
  window.keryx.getConfig().then((config) => {
    if (config && config.miningAddress) addrVal.textContent = config.miningAddress;
    if (config && config.tier) {
      const labels = {
        'default': 'default (Dolphin-8B)',
        'very-light': 'very-light (Qwen3-1.7B)',
        'light': 'light (Gemma-3-4B)',
        'high': 'high (Qwen3-32B)',
        'very-high': 'very-high (Llama-3.3-70B)',
      };
      tierVal.textContent = labels[config.tier] || config.tier;
    }
    resetShareCounter();
    fetchNetworkStats();
    setInterval(fetchNetworkStats, 30000);
  });

  window._modelFallbackTimer = setTimeout(() => {
    if (modelNameEl.textContent === 'no model loaded' || modelNameEl.textContent === 'awaiting model info...') {
      modelNameEl.textContent = 'awaiting model info...';
    }
  }, 5000);
})();