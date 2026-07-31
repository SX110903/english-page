/* ==========================================================================
   sections.js — narrative sections: nav state, scroll wash, trust marquee,
   lesson demo, method stepper, skills switcher, FAQ, persistent CTA.
   ========================================================================== */

(function () {
  'use strict';

  var C = LC.core;
  var D = LC.data;

  /* ---------- reading progress, nav state, section wash ------------------ */
  function initScrollChrome() {
    var fill = C.$('#progressFill');
    var nav = C.$('.nav');
    var dock = C.$('#dock');
    var hero = C.$('.hero');
    var wash = C.$('.ground-wash');
    var links = C.$$('.nav__link[data-target]');
    var ticking = false;

    var sections = links.map(function (a) {
      return { link: a, node: document.getElementById(a.dataset.target) };
    }).filter(function (s) { return s.node; });

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.scrollY || doc.scrollTop;

      if (fill) fill.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      if (nav) nav.classList.toggle('is-stuck', y > 12);

      if (dock && hero) {
        dock.classList.toggle('is-shown', y > hero.offsetHeight * 0.85);
      }

      var mid = y + window.innerHeight * 0.4;
      var current = null;
      sections.forEach(function (s) {
        if (s.node.offsetTop <= mid) current = s;
      });
      links.forEach(function (a) { a.classList.toggle('is-active', current && a === current.link); });

      if (wash && current && current.node.dataset.hue) {
        wash.style.setProperty('--wash-h', current.node.dataset.hue);
      }
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- trust marquee ----------------------------------------------
     This one keeps scrolling even when the system asks for reduced motion:
     it is a deliberate, explicit choice by the site owner. To stay usable it
     runs slower in that case and pauses whenever the pointer or keyboard
     focus is on it, so the text can always be read.                        */
  function initMarquee() {
    var track = C.$('#stripTrack');
    if (!track) return;

    var strip = track.parentNode;

    /* duplicate once so the loop is seamless */
    track.innerHTML += track.innerHTML;

    var x = 0;
    var half = 0;
    var paused = false;

    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure, { passive: true });

    /* ~36 px/s normally, ~27 px/s under reduced motion: clearly in motion in
       both cases, still slow enough to read without chasing the text */
    function speed() { return C.motion.enabled ? 0.6 : 0.45; }

    function loop() {
      if (paused) return;
      x -= speed();
      if (half && -x >= half) x += half;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    }

    function pause() { paused = true; }
    function resume() { paused = false; }

    strip.addEventListener('pointerenter', pause);
    strip.addEventListener('pointerleave', resume);
    strip.addEventListener('focusin', pause);
    strip.addEventListener('focusout', resume);

    var stop = null;
    C.onScreen(strip,
      function () { if (!stop) stop = C.addTask(loop); },
      function () { if (stop) { stop(); stop = null; } });
  }

  /* ---------- interactive lesson ----------------------------------------- */
  function initLesson() {
    var host = C.$('#lessonReplies');
    var transcript = C.$('#lessonTranscript');
    var noteHost = C.$('#lessonNote');
    if (!host || !transcript) return;

    function addTurn(turn, isStudent) {
      var wrap = C.el('div', { class: 'turn' + (isStudent ? ' turn--student' : '') });
      wrap.appendChild(C.el('span', { class: 'turn__bullet' }));
      var body = C.el('div');
      body.appendChild(C.el('div', { class: 'turn__who', text: isStudent ? 'Student' : 'Teacher' }));
      body.appendChild(C.el('div', { class: 'turn__say', text: turn.en }));
      body.appendChild(C.el('div', { class: 'turn__zh', text: turn.zh }));
      wrap.appendChild(body);
      transcript.appendChild(wrap);

      if (C.motion.enabled) {
        wrap.animate(
          [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: 460, easing: 'cubic-bezier(.2,.8,.28,1)', fill: 'both' }
        );
      }
      return wrap;
    }

    D.lesson.replies.forEach(function (r, i) {
      var btn = C.el('button', { class: 'reply', type: 'button' });
      btn.appendChild(C.el('span', { class: 'en', text: r.en }));
      btn.appendChild(C.el('small', { text: r.zh }));

      btn.addEventListener('click', function () {
        C.$$('.reply', host).forEach(function (b) {
          b.disabled = true;
          if (b !== btn) b.classList.add('is-dim');
        });
        btn.classList.add('is-picked');

        addTurn({ en: r.en, zh: '' }, true);

        var note = C.el('div', { class: 'note' });
        note.appendChild(C.el('div', { class: 'note__title', text: r.ok ? '自然表达' : '温和纠正' }));
        note.appendChild(C.el('p', { text: r.note }));
        if (r.fix) {
          var fix = C.el('p');
          fix.appendChild(C.el('span', { class: 'en', text: r.fix }));
          note.appendChild(fix);
        }
        noteHost.innerHTML = '';
        noteHost.appendChild(note);

        if (r.ok) C.burst(btn, 10);

        setTimeout(function () { addTurn(r.next, false); }, 520);

        var again = C.el('button', {
          class: 'btn btn--quiet btn--sm',
          type: 'button',
          text: '换一个回答试试'
        });
        again.addEventListener('click', reset);
        noteHost.appendChild(again);
      });

      host.appendChild(btn);
    });

    function reset() {
      transcript.innerHTML = '';
      D.lesson.opening.forEach(function (t) { addTurn(t, t.who === 'Student'); });
      noteHost.innerHTML = '';
      C.$$('.reply', host).forEach(function (b) {
        b.disabled = false;
        b.classList.remove('is-dim', 'is-picked');
      });
    }

    D.lesson.opening.forEach(function (t) { addTurn(t, t.who === 'Student'); });
  }

  /* ---------- method: scroll-driven figure -------------------------------- */
  function initMethod() {
    var steps = C.$$('.step');
    var bars = C.$$('#methodFigure .figure__bar');
    var arc = C.$('#methodArc');
    var numOut = C.$('#figureNum');
    var zhOut = C.$('#figureZh');
    var enOut = C.$('#figureEn');
    var section = C.$('#method');
    if (!steps.length || !section) return;

    var total = D.method.length;
    var current = -1;

    function show(i) {
      if (i === current || !D.method[i]) return;
      current = i;
      var phase = D.method[i];

      steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });

      numOut.textContent = '0' + (i + 1);
      zhOut.textContent = phase.zh;
      enOut.textContent = phase.en;

      bars.forEach(function (bar, n) {
        var v = phase.bars[n] || 0.2;
        bar.style.transform = 'scaleY(' + v.toFixed(2) + ')';
        bar.style.fill = 'hsl(' + phase.hue + ' 85% 62%)';
      });

      if (arc) {
        var len = 289; /* 2πr, r = 46 */
        arc.style.strokeDasharray = len;
        arc.style.strokeDashoffset = len * (1 - (i + 1) / total);
        arc.style.stroke = 'hsl(' + phase.hue + ' 85% 62%)';
      }
    }

    show(0);

    if (!('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('is-active'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) show(parseInt(e.target.dataset.step, 10));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- skills switcher -------------------------------------------- */
  function initSkills() {
    var list = C.$('#skillList');
    var detail = C.$('#skillDetail');
    if (!list || !detail) return;

    function paint(i) {
      var s = D.skills[i];
      C.$$('.skill', list).forEach(function (b, n) {
        b.classList.toggle('is-on', n === i);
        b.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });

      detail.innerHTML = '';
      var h = C.el('h3');
      h.appendChild(C.el('span', { class: 'en', text: s.en }));
      h.appendChild(document.createTextNode(' ' + s.zh));
      detail.appendChild(h);
      detail.appendChild(C.el('p', { text: s.text }));

      var sample = C.el('div', { class: 'skill-detail__sample' });
      sample.appendChild(C.el('div', { class: 'en', text: s.sample.en }));
      sample.appendChild(C.el('small', { text: s.sample.zh }));
      detail.appendChild(sample);

      if (C.motion.enabled) {
        detail.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, easing: 'cubic-bezier(.2,.8,.28,1)' }
        );
      }
    }

    D.skills.forEach(function (s, i) {
      var btn = C.el('button', {
        class: 'skill',
        type: 'button',
        role: 'tab',
        'aria-selected': i === 0 ? 'true' : 'false'
      });

      btn.appendChild(C.el('span', { class: 'skill__en', text: s.en }));
      btn.appendChild(C.el('span', { class: 'skill__zh', text: s.zh }));

      var bars = C.el('span', { class: 'skill__bars', 'aria-hidden': 'true' });
      s.bars.forEach(function (v) {
        bars.appendChild(C.el('i', { style: 'height:' + Math.round(v * 100) + '%' }));
      });
      btn.appendChild(bars);

      btn.addEventListener('click', function () { paint(i); });
      btn.addEventListener('mouseenter', function () { paint(i); });

      /* roving arrow-key navigation */
      btn.addEventListener('keydown', function (e) {
        var all = C.$$('.skill', list);
        var here = all.indexOf(btn);
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = all[(here + 1) % all.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = all[(here - 1 + all.length) % all.length];
        if (next) { e.preventDefault(); next.focus(); next.click(); }
      });

      list.appendChild(btn);
    });

    paint(0);
  }

  /* ---------- brief, non-blocking loading veil --------------------------- */
  function initVeil() {
    var veil = C.$('#veil');
    if (!veil) return;

    var bars = C.$$('#veil .veil__bars i');
    var anims = [];

    if (C.motion.enabled) {
      bars.forEach(function (b, i) {
        anims.push(b.animate(
          [{ transform: 'scaleY(.25)' }, { transform: 'scaleY(1)' }, { transform: 'scaleY(.25)' }],
          { duration: 900, delay: i * 90, iterations: Infinity, easing: 'ease-in-out' }
        ));
      });
    }

    function dismiss() {
      veil.classList.add('is-gone');
      anims.forEach(function (a) { a.cancel(); });
      setTimeout(function () { veil.remove(); }, 600);
    }

    /* never block: hide as soon as the page is usable, and hard-cap the wait */
    var capped = setTimeout(dismiss, C.motion.enabled ? 900 : 0);
    window.addEventListener('load', function () {
      clearTimeout(capped);
      setTimeout(dismiss, C.motion.enabled ? 260 : 0);
    });
  }

  /* ---------- QR fallback (image is supplied by the site owner) ---------- */
  function initQr() {
    var img = C.$('#qrImg');
    var ph = C.$('#qrPh');
    if (!img || !ph) return;

    function ok() {
      ph.style.display = 'none';
      img.style.display = 'block';
      img.parentNode.classList.add('has-qr');
    }

    function fail() {
      img.style.display = 'none';
      ph.style.display = 'grid';
      img.parentNode.classList.remove('has-qr');
    }

    if (img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
    img.addEventListener('load', ok);
    img.addEventListener('error', fail);
  }

  /* ---------- copy the WeChat id ----------------------------------------- */
  function initCopy() {
    var btn = C.$('#copyWechat');
    if (!btn) return;
    var id = btn.dataset.value;

    btn.addEventListener('click', function () {
      function done() {
        var old = btn.textContent;
        btn.textContent = '已复制';
        C.burst(btn, 8);
        setTimeout(function () { btn.textContent = old; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(done, function () { window.prompt('复制微信号：', id); });
      } else {
        window.prompt('复制微信号：', id);
      }
    });
  }

  LC.sections = {
    init: function () {
      initVeil();
      initScrollChrome();
      initMarquee();
      initLesson();
      initMethod();
      initSkills();
      initQr();
      initCopy();
    }
  };
})();
