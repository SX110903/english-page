/* ==========================================================================
   core.js — motion policy, reveal observer, shared progress store, helpers.
   These play the role of the requested hooks (useReducedMotion,
   useIntersectionAnimation, useGameProgress) in a no-framework codebase.
   ========================================================================== */

window.LC = window.LC || {};

(function () {
  'use strict';

  /* ---------- motion policy (useReducedMotion) --------------------------- */
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  var motion = {
    enabled: !mq.matches,
    listeners: [],
    onChange: function (fn) { this.listeners.push(fn); }
  };

  function applyMotion() {
    motion.enabled = !mq.matches;
    document.documentElement.setAttribute('data-motion', motion.enabled ? 'on' : 'off');
    motion.listeners.forEach(function (fn) { fn(motion.enabled); });
  }

  if (mq.addEventListener) mq.addEventListener('change', applyMotion);
  else if (mq.addListener) mq.addListener(applyMotion);
  applyMotion();

  /* ---------- tiny DOM helpers ------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] !== null && attrs[k] !== undefined) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* keeps a shuffle from returning the original order (short arrays) */
  function shuffleDistinct(list) {
    if (list.length < 2) return list.slice();
    var out = shuffle(list);
    var same = out.every(function (v, i) { return v === list[i]; });
    return same ? shuffleDistinct(list) : out;
  }

  /* ---------- reveal on enter (useIntersectionAnimation) ----------------- */
  var revealIO = null;

  function initReveals() {
    var nodes = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    nodes.forEach(function (n, i) {
      n.style.setProperty('--reveal-delay', (i % 5) * 70 + 'ms');
      revealIO.observe(n);
    });
  }

  /* observe an element and run a callback while it is on screen */
  function onScreen(node, enter, leave) {
    if (!('IntersectionObserver' in window)) { enter && enter(); return function () {}; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? (enter && enter()) : (leave && leave()); });
    }, { threshold: 0.05 });
    io.observe(node);
    return function () { io.disconnect(); };
  }

  /* ---------- rAF loop registry: everything animated shares one loop ------ */
  var tasks = [];
  var running = false;

  function tick(now) {
    running = false;
    for (var i = 0; i < tasks.length; i++) tasks[i](now);
    if (tasks.length) start();
  }

  function start() {
    if (running || !tasks.length) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function addTask(fn) {
    if (tasks.indexOf(fn) === -1) tasks.push(fn);
    start();
    return function () { removeTask(fn); };
  }

  function removeTask(fn) {
    var i = tasks.indexOf(fn);
    if (i > -1) tasks.splice(i, 1);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) start();
  });

  /* ---------- shared game progress (useGameProgress) --------------------- */
  var progress = {
    points: 0,
    streak: 0,
    bestStreak: 0,
    done: 0,
    stars: 0,
    subs: [],

    subscribe: function (fn) { this.subs.push(fn); fn(this); },

    emit: function () {
      var self = this;
      this.subs.forEach(function (fn) { fn(self); });
    },

    record: function (correct, worth) {
      this.done += 1;
      if (correct) {
        this.streak += 1;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;
        this.points += (worth || 10) + Math.min(this.streak - 1, 4) * 2;
      } else {
        this.streak = 0;
        this.points += 2; /* attempting still counts — no harsh penalty */
      }
      this.stars = Math.min(5, Math.floor(this.points / 40));
      this.emit();
      return this.points;
    }
  };

  /* ---------- reward particles ------------------------------------------- */
  function burst(originEl, count) {
    if (!motion.enabled || !originEl) return;
    var r = originEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var colors = ['var(--amber)', 'var(--coral)', 'var(--blue-bright)'];
    var n = count || 12;

    for (var i = 0; i < n; i++) {
      (function (i) {
        var p = document.createElement('span');
        p.className = 'spark';
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = colors[i % colors.length];
        document.body.appendChild(p);

        var angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        var dist = 40 + Math.random() * 70;
        var anim = p.animate(
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            {
              transform: 'translate(calc(-50% + ' + Math.cos(angle) * dist + 'px), calc(-50% + ' +
                (Math.sin(angle) * dist + 40) + 'px)) scale(0.2) rotate(' + (Math.random() * 220 - 110) + 'deg)',
              opacity: 0
            }
          ],
          { duration: 700 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.3,1)' }
        );
        anim.onfinish = function () { p.remove(); };
      })(i);
    }
  }

  /* ---------- speech synthesis (shared, optional) ------------------------ */
  var speech = {
    supported: typeof window.speechSynthesis !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance !== 'undefined',

    voice: null,

    pickVoice: function () {
      if (!this.supported) return null;
      var voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return null;
      this.voice =
        voices.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0] ||
        voices.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
      return this.voice;
    },

    say: function (text, opts) {
      if (!this.supported) return false;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        if (!this.voice) this.pickVoice();
        if (this.voice) u.voice = this.voice;
        u.lang = (this.voice && this.voice.lang) || 'en-US';
        u.rate = (opts && opts.rate) || 0.92;
        u.pitch = 1;
        if (opts && opts.onend) u.onend = opts.onend;
        if (opts && opts.onstart) u.onstart = opts.onstart;
        window.speechSynthesis.speak(u);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  if (speech.supported) {
    speech.pickVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = function () { speech.pickVoice(); };
    }
  }

  /* ---------- waveform painter (canvas, used by hero + listening) -------- */
  function makeWave(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var conf = opts || {};
    var bars = conf.bars || 34;
    var amp = 0;          /* 0 = idle line, 1 = speaking */
    var target = 0;
    var phase = 0;
    var stop = null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var w = canvas.clientWidth || 300;
      var h = canvas.clientHeight || 54;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function styleOf(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      var gap = 3;
      var bw = Math.max(2, (w - gap * (bars - 1)) / bars);
      var mid = h / 2;
      var cool = styleOf('--blue', '#3E7BFA');
      var warm = styleOf('--amber', '#FFB020');

      amp += (target - amp) * 0.12;
      phase += amp > 0.02 ? 0.22 : 0.03;

      for (var i = 0; i < bars; i++) {
        var t = i / bars;
        var wave = Math.sin(phase + i * 0.55) * 0.5 + 0.5;
        var envelope = Math.sin(Math.PI * t);
        var idle = 0.06 + 0.04 * Math.sin(phase * 0.6 + i * 0.4);
        var v = idle + amp * wave * envelope * 0.92;
        var bh = Math.max(2, v * h);
        ctx.fillStyle = amp > 0.45 && i % 3 === 0 ? warm : cool;
        ctx.globalAlpha = 0.35 + v * 0.65;
        var x = i * (bw + gap);
        var r = Math.min(bw / 2, 2);
        var y = mid - bh / 2;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, bw, bh, r);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, bw, bh);
        }
      }
      ctx.globalAlpha = 1;
    }

    resize();
    draw();

    var onResize = function () { resize(); draw(); };
    window.addEventListener('resize', onResize, { passive: true });

    var api = {
      setLevel: function (v) { target = Math.max(0, Math.min(1, v)); },
      /* run only while on screen and only when motion is allowed */
      attach: function (host) {
        var detach = onScreen(host || canvas,
          function () { if (!stop) stop = addTask(draw); },
          function () { if (stop) { stop(); stop = null; } });
        return function () {
          detach();
          if (stop) { stop(); stop = null; }
          window.removeEventListener('resize', onResize);
        };
      },
      redraw: draw
    };

    if (!motion.enabled) {
      api.setLevel = function () {};
      api.attach = function () { return function () { window.removeEventListener('resize', onResize); }; };
    }

    return api;
  }

  /* ---------- magnetic buttons (pointer only, throttled by rAF) ---------- */
  function initMagnetic() {
    if (!motion.enabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    $$('.btn--magnetic').forEach(function (btn) {
      var raf = 0;
      var mx = 0, my = 0;

      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        mx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        my = (e.clientY - (r.top + r.height / 2)) * 0.3;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          btn.style.setProperty('--mx', mx.toFixed(2) + 'px');
          btn.style.setProperty('--my', my.toFixed(2) + 'px');
        });
      }, { passive: true });

      btn.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  LC.core = {
    motion: motion,
    $: $, $$: $$, el: el,
    shuffle: shuffle,
    shuffleDistinct: shuffleDistinct,
    initReveals: initReveals,
    onScreen: onScreen,
    addTask: addTask,
    removeTask: removeTask,
    progress: progress,
    burst: burst,
    speech: speech,
    makeWave: makeWave,
    initMagnetic: initMagnetic
  };
})();
