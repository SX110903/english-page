/* ==========================================================================
   hero.js — entrance sequence, orbiting vocabulary, typed transcript,
   waveform console and pointer parallax.
   ========================================================================== */

(function () {
  'use strict';

  var C = LC.core;
  var D = LC.data;

  function initIntro() {
    var lines = C.$$('.hero h1 .line > span');

    if (!C.motion.enabled) {
      lines.forEach(function (s) { s.style.transform = 'none'; });
      C.$$('.hero .stagger').forEach(function (n) { n.style.opacity = '1'; n.style.transform = 'none'; });
      return;
    }

    lines.forEach(function (span, i) {
      span.animate(
        [{ transform: 'translateY(102%)' }, { transform: 'translateY(0)' }],
        { duration: 900, delay: 120 + i * 110, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'both' }
      );
    });

    C.$$('.hero .stagger').forEach(function (node, i) {
      node.animate(
        [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
        { duration: 700, delay: 420 + i * 110, easing: 'cubic-bezier(.2,.8,.28,1)', fill: 'both' }
      );
    });
  }

  /* ---------- orbiting vocabulary ---------------------------------------- */
  function initOrbit() {
    var host = C.$('.stage__orbit');
    if (!host) return;

    var items = D.heroWords.map(function (w, i) {
      var node = C.el('button', {
        class: 'word',
        type: 'button',
        'aria-label': w.en + '，中文意思：' + w.zh + '。点击朗读'
      }, []);
      node.appendChild(C.el('span', { text: w.en }));
      node.appendChild(C.el('span', { class: 'word__zh', text: w.zh }));

      node.addEventListener('click', function () {
        LC.hero.speakWord(w.en);
      });

      host.appendChild(node);
      return {
        node: node,
        a: (Math.PI * 2 * i) / D.heroWords.length,
        r: 0,
        speed: 0.00012 + (i % 3) * 0.00004,
        wob: i * 1.7
      };
    });

    function layout() {
      var w = host.clientWidth;
      var h = host.clientHeight;
      var rx = Math.max(120, w * 0.44);
      var ry = Math.max(110, h * 0.42);
      items.forEach(function (it) { it.rx = rx; it.ry = ry; });
    }

    function place(now) {
      items.forEach(function (it) {
        var a = it.a + (C.motion.enabled ? now * it.speed : 0);
        var x = Math.cos(a) * it.rx;
        var y = Math.sin(a) * it.ry * 0.72 +
          (C.motion.enabled ? Math.sin(now * 0.0006 + it.wob) * 6 : 0);
        it.node.style.transform =
          'translate3d(calc(-50% + ' + x.toFixed(1) + 'px), calc(-50% + ' + y.toFixed(1) + 'px), 0)';
      });
    }

    layout();
    place(0);
    window.addEventListener('resize', function () { layout(); place(performance.now()); }, { passive: true });

    if (!C.motion.enabled) return;

    var stop = null;
    C.onScreen(host,
      function () { if (!stop) stop = C.addTask(place); },
      function () { if (stop) { stop(); stop = null; } });
  }

  /* ---------- typed transcript + waveform console ------------------------ */
  function initConsole() {
    var enOut = C.$('#consoleEn');
    var zhOut = C.$('#consoleZh');
    var whoOut = C.$('#consoleWho');
    var canvas = C.$('#heroWave');
    var speakBtn = C.$('#heroSpeak');
    if (!enOut || !canvas) return;

    var wave = C.makeWave(canvas, { bars: 30 });
    wave.attach(C.$('.console'));

    var idx = 0;
    var timer = null;

    function render(line, typed) {
      whoOut.textContent = line.who;
      enOut.textContent = typed;
      zhOut.textContent = typed.length >= line.en.length ? line.zh : '';
    }

    function typeLine(line, done) {
      var i = 0;
      render(line, '');
      enOut.appendChild(C.el('span', { class: 'console__caret' }));

      timer = setInterval(function () {
        i += 1;
        render(line, line.en.slice(0, i));
        if (i < line.en.length) {
          enOut.appendChild(C.el('span', { class: 'console__caret' }));
          wave.setLevel(0.35 + Math.random() * 0.3);
        } else {
          clearInterval(timer);
          timer = null;
          wave.setLevel(0);
          setTimeout(done, 1900);
        }
      }, 46);
    }

    function cycle() {
      var line = D.heroLines[idx % D.heroLines.length];
      idx += 1;
      typeLine(line, cycle);
    }

    if (C.motion.enabled) {
      setTimeout(cycle, 900);
    } else {
      /* reduced motion: show the exchange in full, no typing */
      var line = D.heroLines[0];
      render(line, line.en);
    }

    /* pronunciation demo — real audio via SpeechSynthesis, no fake scoring */
    function speakWord(text) {
      var spoken = C.speech.say(text, {
        onstart: function () { wave.setLevel(0.95); },
        onend: function () { wave.setLevel(0); }
      });
      if (!spoken) {
        /* no TTS available: still give visual feedback, and say so */
        wave.setLevel(0.9);
        setTimeout(function () { wave.setLevel(0); }, 800);
        var hint = C.$('#heroHint');
        if (hint) hint.textContent = '当前浏览器不支持朗读，可查看音标练习。';
      }
      return spoken;
    }

    if (speakBtn) {
      speakBtn.addEventListener('click', function () {
        var line = D.heroLines[(idx - 1 + D.heroLines.length) % D.heroLines.length] || D.heroLines[0];
        speakWord(line.en);
      });
      if (!C.speech.supported) {
        speakBtn.disabled = true;
        speakBtn.title = '当前浏览器不支持语音朗读';
      }
    }

    LC.hero.speakWord = speakWord;
  }

  /* ---------- pointer parallax (single listener, rAF-lerped) ------------- */
  function initParallax() {
    var stage = C.$('.stage');
    if (!stage || !C.motion.enabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0;
    var active = false;

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      stage.style.setProperty('--px', cx.toFixed(3));
      stage.style.setProperty('--py', cy.toFixed(3));
    }

    var stop = null;
    C.onScreen(stage,
      function () { if (!stop) { stop = C.addTask(loop); active = true; } },
      function () { if (stop) { stop(); stop = null; active = false; } });
  }

  LC.hero = {
    speakWord: function () { return false; },
    init: function () {
      initIntro();
      initOrbit();
      initConsole();
      initParallax();
    }
  };
})();
