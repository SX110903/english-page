/* ==========================================================================
   effects.js — pointer-driven effects that CSS alone cannot express:
   3D tilt, click ripples, and a score bump. All of it is opt-out under
   prefers-reduced-motion and on touch/coarse pointers.
   ========================================================================== */

(function () {
  'use strict';

  var C = LC.core;

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 3D tilt on cards ------------------------------------------- */
  function initTilt() {
    if (!C.motion.enabled || !finePointer) return;

    var MAX = 7; /* degrees — subtle enough to stay readable */
    var targets = C.$$('.fact, .qr, .console, .word-card');

    targets.forEach(function (node) {
      node.classList.add('tilt');
      var raf = 0;
      var rx = 0, ry = 0;

      function apply() {
        raf = 0;
        node.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        node.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      }

      node.addEventListener('pointermove', function (e) {
        var r = node.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        rx = -py * MAX * 2;
        ry = px * MAX * 2;
        node.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });

      node.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        node.classList.remove('is-tilting');
        node.style.setProperty('--rx', '0deg');
        node.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- click ripple ------------------------------------------------ */
  function initRipple() {
    if (!C.motion.enabled) return;

    document.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest ? e.target.closest('.btn, .option, .tile, .tab, .reply') : null;
      if (!btn || btn.disabled) return;

      var r = btn.getBoundingClientRect();
      var dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.left = (e.clientX - r.left) + 'px';
      dot.style.top = (e.clientY - r.top) + 'px';

      /* the host must clip and position the ripple */
      var cs = getComputedStyle(btn);
      if (cs.position === 'static') btn.style.position = 'relative';
      if (cs.overflow === 'visible') btn.style.overflow = 'hidden';

      btn.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 640);
    }, { passive: true });
  }

  /* ---------- score reacts when points land ------------------------------ */
  function initScorePulse() {
    var out = C.$('#railPoints');
    if (!out) return;

    var last = 0;
    C.progress.subscribe(function (p) {
      if (p.points === last) return;
      var gained = p.points > last;
      last = p.points;
      if (!gained || !C.motion.enabled) return;

      out.classList.add('is-bumped');
      out.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' }
      );
      setTimeout(function () { out.classList.remove('is-bumped'); }, 700);
    });
  }

  /* ---------- section headings drift in on scroll ------------------------ */
  function initHeadingDrift() {
    if (!C.motion.enabled) return;
    if (!('IntersectionObserver' in window)) return;

    var heads = C.$$('.section__head h2');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.animate(
          [
            { opacity: 0, transform: 'translateY(18px) scale(0.985)' },
            { opacity: 1, transform: 'none' }
          ],
          { duration: 700, easing: 'cubic-bezier(.2,.8,.28,1)', fill: 'both' }
        );
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.1 });

    heads.forEach(function (h) { io.observe(h); });
  }

  LC.effects = {
    init: function () {
      initTilt();
      initRipple();
      initScorePulse();
      initHeadingDrift();
    }
  };
})();
