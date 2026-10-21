/* ============================================================
   PROJECT: KARALIKA ROY — PREMIUM STUDENT PORTFOLIO
   script.js — all interactive functionality
   ============================================================ */

'use strict';

/* ----------------------------------------------------------
   0. SAFE LOCALSTORAGE WRAPPER
   ---------------------------------------------------------- */
const store = {
  get(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val === null ? fallback : val;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* silently ignore — storage may be disabled */
    }
  }
};

/* ----------------------------------------------------------
   1. LOADER
   ---------------------------------------------------------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 500);
  }
});

/* ----------------------------------------------------------
   2. THEME TOGGLE
   ---------------------------------------------------------- */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    if (themeIcon) themeIcon.textContent = '☀️';
    if (themeToggle) themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    document.body.classList.remove('dark');
    if (themeIcon) themeIcon.textContent = '🌙';
    if (themeToggle) themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }
}

const savedTheme = store.get('kr-theme', 'light');
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    applyTheme(newTheme);
    store.set('kr-theme', newTheme);
  });
}

/* ----------------------------------------------------------
   3. MOBILE HAMBURGER MENU
   ---------------------------------------------------------- */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
    });
  });

  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ----------------------------------------------------------
   4. ACTIVE NAV HIGHLIGHT + NAVBAR SCROLL SHADOW
   ---------------------------------------------------------- */
const sections = document.querySelectorAll('main section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');
const navbar = document.querySelector('.navbar');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

sections.forEach(s => sectionObserver.observe(s));

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ----------------------------------------------------------
   5. SCROLL REVEAL ANIMATIONS
   ---------------------------------------------------------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el, i) => {
  if (el.hasAttribute('data-stagger')) {
    el.style.transitionDelay = (i % 8) * 0.06 + 's';
  }
  revealObserver.observe(el);
});

/* ----------------------------------------------------------
   6. COUNT-UP ACHIEVEMENT NUMBERS
   ---------------------------------------------------------- */
const countUpEls = document.querySelectorAll('.count-up');
let countUpDone = false;

function animateCountUp(el) {
  const target = parseInt(el.getAttribute('data-target'), 10) || 0;
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !countUpDone) {
      countUpDone = true;
      countUpEls.forEach(animateCountUp);
      countObserver.disconnect();
    }
  });
}, { threshold: 0.4 });

const academicsSection = document.getElementById('academics');
if (academicsSection) countObserver.observe(academicsSection);

/* ----------------------------------------------------------
   7. BACK TO TOP
   ---------------------------------------------------------- */
const floatTopBtn = document.getElementById('floatTopBtn');
const backToTopBtn = document.getElementById('backToTopBtn');

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (floatTopBtn) floatTopBtn.addEventListener('click', scrollToTop);
if (backToTopBtn) backToTopBtn.addEventListener('click', scrollToTop);

window.addEventListener('scroll', () => {
  if (floatTopBtn) floatTopBtn.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

/* ----------------------------------------------------------
   8. FOOTER YEAR
   ---------------------------------------------------------- */
const footerYear = document.getElementById('footerYear');
if (footerYear) footerYear.textContent = new Date().getFullYear();

/* ----------------------------------------------------------
   9. CALCULATOR (safe, non-eval)
   ---------------------------------------------------------- */
(function initCalculator() {
  const display = document.getElementById('calcResult');
  const expressionEl = document.getElementById('calcExpression');
  if (!display) return;

  let currentInput = '0';
  let previousValue = null;
  let pendingOperator = null;
  let resetOnNextDigit = false;

  const opSymbols = { '+': '+', '−': '−', '×': '×', '÷': '÷' };

  function formatNumber(num) {
    if (!isFinite(num)) return 'Error';
    if (Number.isInteger(num)) {
      if (Math.abs(num) >= 1e12) return num.toExponential(6);
      return String(num);
    }
    const rounded = parseFloat(num.toPrecision(12));
    if (Math.abs(rounded) >= 1e12) return rounded.toExponential(6);
    return String(rounded);
  }

  function render(resultText) {
    const val = resultText !== undefined ? resultText : currentInput;
    display.textContent = val.length > 16 ? val.slice(0, 16) + '…' : val;
    display.setAttribute('title', val);
  }

  function renderExpression() {
    if (!expressionEl) return;
    if (previousValue !== null && pendingOperator) {
      expressionEl.textContent =
        formatNumber(previousValue) + ' ' + (opSymbols[pendingOperator] || pendingOperator);
    } else {
      expressionEl.textContent = '';
    }
  }

  function showError(msg) {
    currentInput = '0';
    previousValue = null;
    pendingOperator = null;
    resetOnNextDigit = true;
    render('Error');
    if (expressionEl) expressionEl.textContent = msg || '';
  }

  function flashSuccess() {
    display.classList.remove('success');
    void display.offsetWidth;
    display.classList.add('success');
  }

  function inputDigit(d) {
    if (resetOnNextDigit) {
      currentInput = d;
      resetOnNextDigit = false;
    } else {
      if (currentInput === '0' && d !== '.') {
        currentInput = d;
      } else {
        if (d === '.' && currentInput.includes('.')) return;
        if (currentInput.replace('-', '').replace('.', '').length >= 14) return;
        currentInput += d;
      }
    }
    render();
  }

  function inputOperator(op) {
    if (currentInput === 'Error') return;
    const numeric = parseFloat(currentInput);
    if (isNaN(numeric)) return;

    if (pendingOperator !== null && previousValue !== null && !resetOnNextDigit) {
      const res = compute(previousValue, numeric, pendingOperator);
      if (res === null) { showError('Cannot divide by zero'); return; }
      previousValue = res;
      currentInput = formatNumber(res);
      render();
    } else {
      previousValue = numeric;
    }
    pendingOperator = op;
    resetOnNextDigit = true;
    renderExpression();
  }

  function compute(a, b, op) {
    let r;
    switch (op) {
      case '+': r = a + b; break;
      case '−': r = a - b; break;
      case '×': r = a * b; break;
      case '÷':
        if (b === 0) return null;
        r = a / b;
        break;
      default: return null;
    }
    if (!isFinite(r) || isNaN(r)) return null;
    return r;
  }

  function equals() {
    if (currentInput === 'Error') { clearAll(); return; }
    if (pendingOperator === null || previousValue === null) {
      render();
      return;
    }
    const numeric = parseFloat(currentInput);
    if (isNaN(numeric)) { showError('Invalid input'); return; }
    const res = compute(previousValue, numeric, pendingOperator);
    if (res === null) { showError('Cannot divide by zero'); return; }
    currentInput = formatNumber(res);
    previousValue = null;
    pendingOperator = null;
    resetOnNextDigit = true;
    render();
    if (expressionEl) expressionEl.textContent = '';
    flashSuccess();
  }

  function clearAll() {
    currentInput = '0';
    previousValue = null;
    pendingOperator = null;
    resetOnNextDigit = false;
    render();
    if (expressionEl) expressionEl.textContent = '';
  }

  function deleteLast() {
    if (resetOnNextDigit || currentInput === 'Error') {
      currentInput = '0';
      resetOnNextDigit = false;
    } else {
      currentInput = currentInput.slice(0, -1) || '0';
      if (currentInput === '-' || currentInput === '') currentInput = '0';
    }
    render();
  }

  function percent() {
    const numeric = parseFloat(currentInput);
    if (isNaN(numeric)) return;
    const result = numeric / 100;
    currentInput = formatNumber(result);
    resetOnNextDigit = true;
    render();
  }

  function toggleSign() {
    if (currentInput === '0' || currentInput === 'Error') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    render();
  }

  /* Button clicks */
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const value = btn.getAttribute('data-value');

      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);

      switch (action) {
        case 'digit': inputDigit(value); break;
        case 'operator': inputOperator(value); break;
        case 'equals': equals(); break;
        case 'clear': clearAll(); break;
        case 'delete': deleteLast(); break;
        case 'percent': percent(); break;
        case 'sign': toggleSign(); break;
      }
    });
  });

  /* Keyboard support */
  document.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    const calc = document.getElementById('calculator');
    if (!calc) return;
    const rect = calc.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    const key = e.key;
    if (/^[0-9]$/.test(key)) { inputDigit(key); e.preventDefault(); }
    else if (key === '.') { inputDigit('.'); e.preventDefault(); }
    else if (key === '+') { inputOperator('+'); e.preventDefault(); }
    else if (key === '-') { inputOperator('−'); e.preventDefault(); }
    else if (key === '*') { inputOperator('×'); e.preventDefault(); }
    else if (key === '/') { inputOperator('÷'); e.preventDefault(); e.preventDefault(); }
    else if (key === '%') { percent(); e.preventDefault(); }
    else if (key === 'Enter' || key === '=') { equals(); e.preventDefault(); }
    else if (key === 'Escape') { clearAll(); e.preventDefault(); }
    else if (key === 'Backspace') { deleteLast(); e.preventDefault(); }
  });

  clearAll();
})();

/* ----------------------------------------------------------
   10. STAR CATCHER GAME
   ---------------------------------------------------------- */
(function initGame() {
  const area = document.getElementById('gameArea');
  if (!area) return;

  const player = document.getElementById('player');
  const scoreEl = document.getElementById('gameScore');
  const timeEl = document.getElementById('gameTime');
  const bestEl = document.getElementById('gameBest');
  const overlay = document.getElementById('gameOverlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const startBtn = document.getElementById('startGameBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const soundBtn = document.getElementById('soundBtn');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const effectsLayer = document.getElementById('gameEffects');

  const GAME_DURATION = 30;
  const PLAYER_WIDTH = () => player.offsetWidth || 60;

  let state = {
    running: false,
    paused: false,
    ended: false,
    score: 0,
    timeLeft: GAME_DURATION,
    best: parseInt(store.get('kr-best', '0'), 10) || 0,
    playerX: 0,
    keys: { left: false, right: false },
    stars: [],
    lastSpawn: 0,
    spawnInterval: 850,
    speed: 1.1,
    soundOn: store.get('kr-sound', 'true') === 'true',
    rafId: null,
    timerId: null,
    lastFrame: 0,
    touchActive: false
  };

  let audioCtx = null;

  function initAudio() {
    if (!state.soundOn) return null;
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTone(freq, duration, type, volume) {
    if (!state.soundOn) return;
    const ctx = initAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) { /* ignore audio errors */ }
  }

  function updateBestDisplay() {
    if (bestEl) bestEl.textContent = state.best;
  }

  function setPlayerCenter() {
    const areaW = area.clientWidth;
    state.playerX = areaW / 2 - PLAYER_WIDTH() / 2;
    player.style.left = state.playerX + 'px';
  }

  function movePlayer(dx) {
    if (!state.running || state.paused) return;
    const areaW = area.clientWidth;
    const maxX = areaW - PLAYER_WIDTH();
    state.playerX = Math.max(0, Math.min(maxX, state.playerX + dx));
    player.style.left = state.playerX + 'px';
  }

  function spawnStar() {
    const areaW = area.clientWidth;
    const isBonus = Math.random() < 0.15;
    const star = document.createElement('div');
    star.className = 'star' + (isBonus ? ' bonus' : '');
    star.textContent = isBonus ? '🌟' : (Math.random() < 0.5 ? '⭐' : '✨');
    const size = isBonus ? 44 : 38;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    const x = Math.random() * (areaW - size - 10) + 5;
    const y = -50;
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    star.dataset.bonus = isBonus ? '1' : '0';
    star.dataset.x = x;
    star.dataset.y = y;
    area.appendChild(star);
    state.stars.push({
      el: star,
      x: x,
      y: y,
      size: size,
      speed: state.speed * (isBonus ? 0.85 : 1) * (0.8 + Math.random() * 0.5),
      bonus: isBonus,
      caught: false
    });
  }

  function createParticles(x, y, color) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'catch-particle';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 20 + Math.random() * 30;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = color;
      effectsLayer.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }

  function showScorePop(x, y, points) {
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = '+' + points;
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
    effectsLayer.appendChild(pop);
    setTimeout(() => pop.remove(), 850);
  }

  function handleCatch(star) {
    if (star.caught) return;
    star.caught = true;
    const points = star.bonus ? 3 : 1;
    state.score += points;
    if (scoreEl) scoreEl.textContent = state.score;

    const rect = star.el.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const px = rect.left - areaRect.left + rect.width / 2;
    const py = rect.top - areaRect.top + rect.height / 2;

    createParticles(px, py, star.bonus ? '#ffd700' : '#ffb3d1');
    showScorePop(px, py, points);
    playTone(star.bonus ? 880 : 660, 0.12, 'sine', 0.1);

    star.el.remove();
    const idx = state.stars.indexOf(star);
    if (idx > -1) state.stars.splice(idx, 1);

    if (state.score > 0 && state.score % 10 === 0) {
      state.speed = Math.min(2.6, 1.1 + state.score * 0.04);
      state.spawnInterval = Math.max(400, 850 - state.score * 12);
    }
  }

  function updateStars() {
    const areaH = area.clientHeight;
    const playerRect = player.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const playerTop = playerRect.top - areaRect.top;
    const playerLeft = playerRect.left - areaRect.left;
    const playerRight = playerLeft + playerRect.width;

    for (let i = state.stars.length - 1; i >= 0; i--) {
      const star = state.stars[i];
      if (star.caught) continue;
      star.y += star.speed;
      star.el.style.top = star.y + 'px';

      const starCenterX = star.x + star.size / 2;
      const starCenterY = star.y + star.size / 2;

      if (starCenterY >= playerTop &&
          starCenterY <= playerTop + playerRect.height + 10 &&
          starCenterX >= playerLeft - 8 &&
          starCenterX <= playerRight + 8) {
        handleCatch(star);
        continue;
      }

      if (star.y > areaH) {
        star.el.remove();
        state.stars.splice(i, 1);
      }
    }
  }

  function gameLoop(ts) {
    if (!state.running || state.paused) return;
    if (!state.lastFrame) state.lastFrame = ts;
    const dt = Math.min(ts - state.lastFrame, 50);
    state.lastFrame = ts;

    if (state.keys.left) movePlayer(-6 * (dt / 16.67));
    if (state.keys.right) movePlayer(6 * (dt / 16.67));

    if (!state.lastSpawn) state.lastSpawn = ts;
    if (ts - state.lastSpawn > state.spawnInterval) {
      spawnStar();
      state.lastSpawn = ts;
    }

    updateStars();
    state.rafId = requestAnimationFrame(gameLoop);
  }

  function startTimer() {
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (state.paused || !state.running) return;
      state.timeLeft--;
      if (timeEl) timeEl.textContent = Math.max(0, state.timeLeft);
      if (state.timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function startGame() {
    stopAllLoops();
    clearGameObjects();

    state.running = true;
    state.paused = false;
    state.ended = false;
    state.score = 0;
    state.timeLeft = GAME_DURATION;
    state.speed = 1.1;
    state.spawnInterval = 850;
    state.lastFrame = 0;
    state.lastSpawn = 0;

    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = GAME_DURATION;
    setPlayerCenter();

    overlay.classList.add('hidden');
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;

    initAudio();
    startTimer();
    state.rafId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (!state.running || state.paused || state.ended) return;
    state.paused = true;
    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    showOverlay('Paused ⏸', 'Take a little break. Press Resume when ready!', '▶ Resume', resumeGame);
  }

  function resumeGame() {
    if (!state.running || !state.paused || state.ended) return;
    state.paused = false;
    state.lastFrame = 0;
    overlay.classList.add('hidden');
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    state.rafId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    state.running = false;
    state.ended = true;
    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
    clearInterval(state.timerId);
    state.timerId = null;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;

    if (state.score > state.best) {
      state.best = state.score;
      store.set('kr-best', String(state.best));
      updateBestDisplay();
    }

    let msg;
    if (state.score >= 25) msg = 'Amazing! You are a superstar catcher! 🌟';
    else if (state.score >= 15) msg = 'Wonderful job! Keep shining! ✨';
    else if (state.score >= 8) msg = 'Great effort! You are getting better! 💫';
    else msg = 'Good try! Every star you catch is a win! 🌈';

    playTone(523, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.1), 150);

    showOverlay(
      'Time\'s Up! ⏰',
      'You caught <strong>' + state.score + '</strong> star' + (state.score === 1 ? '' : 's') + '!<br>' + msg,
      '🔁 Play Again',
      startGame
    );
  }

  function showOverlay(title, text, btnLabel, btnAction) {
    overlayTitle.textContent = title;
    overlayText.innerHTML = text;
    startBtn.textContent = btnLabel;
    startBtn.onclick = btnAction;
    overlay.classList.remove('hidden');
  }

  function stopAllLoops() {
    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
    clearInterval(state.timerId);
    state.timerId = null;
    state.running = false;
    state.paused = false;
  }

  function clearGameObjects() {
    state.stars.forEach(s => s.el.remove());
    state.stars = [];
    effectsLayer.innerHTML = '';
  }

  function resetGame() {
    stopAllLoops();
    clearGameObjects();
    state.ended = false;
    state.score = 0;
    state.timeLeft = GAME_DURATION;
    state.speed = 1.1;
    state.spawnInterval = 850;
    if (scoreEl) scoreEl.textContent = '0';
    if (timeEl) timeEl.textContent = GAME_DURATION;
    setPlayerCenter();
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    showOverlay(
      'Ready to Catch Stars? 🌟',
      'Move your basket with the <strong>arrow keys</strong>, <strong>A / D</strong> keys, or drag your finger. Catch falling stars for 30 seconds!',
      '▶ Play',
      startGame
    );
  }

  /* --- Event listeners --- */
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', pauseGame);
  resumeBtn.addEventListener('click', resumeGame);
  restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
  });

  soundBtn.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    store.set('kr-sound', String(state.soundOn));
    soundBtn.textContent = state.soundOn ? '🔊 Sound On' : '🔇 Sound Off';
    soundBtn.setAttribute('aria-pressed', String(state.soundOn));
    if (state.soundOn) playTone(660, 0.1, 'sine', 0.08);
  });
  soundBtn.textContent = state.soundOn ? '🔊 Sound On' : '🔇 Sound Off';
  soundBtn.setAttribute('aria-pressed', String(state.soundOn));

  document.addEventListener('keydown', (e) => {
    const rect = area.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keys.left = true;
      if (state.running && !state.paused) e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keys.right = true;
      if (state.running && !state.paused) e.preventDefault();
    } else if (e.key === ' ' && state.running) {
      e.preventDefault();
      if (state.paused) resumeGame(); else pauseGame();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false;
  });

  /* Touch buttons */
  function bindHold(btn, dir) {
    if (!btn) return;
    const on = (e) => {
      e.preventDefault();
      state.keys[dir] = true;
    };
    const off = (e) => {
      e.preventDefault();
      state.keys[dir] = false;
    };
    btn.addEventListener('touchstart', on, { passive: false });
    btn.addEventListener('touchend', off);
    btn.addEventListener('touchcancel', off);
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
  }
  bindHold(leftBtn, 'left');
  bindHold(rightBtn, 'right');

  /* Drag / touch on game area */
  function handlePointer(clientX) {
    if (!state.running || state.paused) return;
    const areaRect = area.getBoundingClientRect();
    const x = clientX - areaRect.left - PLAYER_WIDTH() / 2;
    const maxX = area.clientWidth - PLAYER_WIDTH();
    state.playerX = Math.max(0, Math.min(maxX, x));
    player.style.left = state.playerX + 'px';
  }

  area.addEventListener('touchstart', (e) => {
    if (!state.running || state.paused) return;
    state.touchActive = true;
    handlePointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  area.addEventListener('touchmove', (e) => {
    if (!state.touchActive || !state.running || state.paused) return;
    handlePointer(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  area.addEventListener('touchend', () => { state.touchActive = false; });

  area.addEventListener('mousemove', (e) => {
    if (!state.running || state.paused) return;
    if (e.buttons === 1) handlePointer(e.clientX);
  });

  /* Visibility change */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.running && !state.paused) {
      pauseGame();
    }
  });

  /* Init */
  updateBestDisplay();
  setPlayerCenter();
  window.addEventListener('resize', () => {
    if (!state.running) {
      setPlayerCenter();
    } else {
      const areaW = area.clientWidth;
      const maxX = areaW - PLAYER_WIDTH();
      state.playerX = Math.max(0, Math.min(maxX, state.playerX));
      player.style.left = state.playerX + 'px';
    }
  });
})();

/* ----------------------------------------------------------
   11. GALLERY LIGHTBOX
   ---------------------------------------------------------- */
(function initGallery() {
  const galleryImgs = document.querySelectorAll('.gallery-item img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  if (!lightbox || !lightboxImg) return;

  let lastFocused = null;

  /* Image load handling */
  galleryImgs.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
    }
    img.addEventListener('error', () => {
      const parent = img.closest('.gallery-item');
      if (parent) parent.classList.add('failed');
    });
  });

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('show'));
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('show');
    setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.src = '';
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }, 300);
  }

  galleryImgs.forEach(img => {
    img.parentElement.addEventListener('click', () => {
      if (img.parentElement.classList.contains('failed')) return;
      openLightbox(img.src, img.alt);
    });
    img.parentElement.setAttribute('tabindex', '0');
    img.parentElement.setAttribute('role', 'button');
    img.parentElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img.src, img.alt);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
})();

/* ----------------------------------------------------------
   12. SMOOTH SCROLL for anchor links (fallback)
   ---------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ----------------------------------------------------------
   13. RESIZE HANDLER for reveal (prevent stuck opacity)
   ---------------------------------------------------------- */
window.addEventListener('resize', () => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    }
  });
}, { passive: true });