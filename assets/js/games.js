/* ==========================================================================
   games.js — the 30-second challenge: four self-contained mini-games sharing
   one tabbed shell, one verdict region (aria-live) and one progress store.

   To add a game: push an entry into `games` with { id, label, title, hint,
   mount(body, verdict) } and add its content to data.js.
   ========================================================================== */

(function () {
  'use strict';

  var C = LC.core;
  var D = LC.data;

  var teardown = null;   /* cleanup for the game currently mounted */

  /* ---------- shared helpers --------------------------------------------- */
  function verdictBox(host) {
    var box = C.el('div', {
      class: 'verdict',
      role: 'status',
      'aria-live': 'polite'
    });
    host.appendChild(box);

    return {
      node: box,
      clear: function () { box.className = 'verdict'; box.innerHTML = ''; },
      show: function (ok, title, lines) {
        box.className = 'verdict is-shown ' + (ok ? 'is-ok' : 'is-no');
        box.innerHTML = '';
        box.appendChild(C.el('span', { class: 'verdict__k', text: title }));
        (lines || []).forEach(function (l) {
          var p = C.el('p');
          if (l.en) p.appendChild(C.el('span', { class: 'en', text: l.en }));
          if (l.text) p.appendChild(document.createTextNode((l.en ? ' — ' : '') + l.text));
          box.appendChild(p);
        });
      }
    };
  }

  function headRow(host, title, hint) {
    var head = C.el('div', { class: 'game__head' });
    head.appendChild(C.el('h3', { class: 'game__title', text: title }));
    head.appendChild(C.el('span', { class: 'game__hint', text: hint }));
    host.appendChild(head);
    return head;
  }

  function metaRow(host) {
    var meta = C.el('div', { class: 'game__meta' });
    host.appendChild(meta);
    return meta;
  }

  function scoreOf(correct, worth, sourceEl) {
    C.progress.record(correct, worth);
    if (correct) C.burst(sourceEl, 12);
  }

  /* ======================================================================
     1. Sentence builder — click to place, click to take back.
        Fully keyboard/touch operable; drag is not required.
     ====================================================================== */
  function mountBuilder(body, verdict) {
    var order = C.shuffle(D.sentences);
    var round = 0;
    var attempts = 0;
    var placed = [];

    headRow(body, '把句子排好', '点击单词放入句子，再点一次可以取回');
    var meta = metaRow(body);

    var zh = C.el('p', { class: 'builder__zh' });
    var slots = C.el('div', { class: 'slots' });
    var bank = C.el('div', { class: 'bank' });
    var actions = C.el('div', { class: 'game__actions' });

    body.appendChild(zh);
    body.appendChild(slots);
    body.appendChild(bank);
    body.appendChild(actions);

    var checkBtn = C.el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: '检查' });
    var resetBtn = C.el('button', { class: 'btn btn--quiet btn--sm', type: 'button', text: '重来' });
    var nextBtn = C.el('button', { class: 'btn btn--warm btn--sm', type: 'button', text: '下一句' });
    nextBtn.style.display = 'none';

    actions.appendChild(checkBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(nextBtn);

    function current() { return order[round % order.length]; }

    function syncMeta() {
      meta.innerHTML = '';
      meta.appendChild(C.el('span', { html: '第 <b>' + (round + 1) + '</b> / ' + order.length + ' 句' }));
      meta.appendChild(C.el('span', { html: '尝试 <b class="tnum">' + attempts + '</b> 次' }));
    }

    function emptyHint() {
      if (!slots.children.length) {
        slots.appendChild(C.el('span', { class: 'slots__hint', text: '点击下面的单词开始排列…' }));
      }
    }

    function place(word, fromBtn) {
      var chip = C.el('button', {
        class: 'tile tile--placed',
        type: 'button',
        text: word,
        'aria-label': '移除单词 ' + word
      });
      chip.addEventListener('click', function () {
        chip.remove();
        placed = placed.filter(function (p) { return p.chip !== chip; });
        fromBtn.disabled = false;
        verdict.clear();
        emptyHint();
      });

      var hint = C.$('.slots__hint', slots);
      if (hint) hint.remove();

      slots.appendChild(chip);
      placed.push({ word: word, chip: chip });
      fromBtn.disabled = true;

      if (C.motion.enabled) {
        chip.animate(
          [{ transform: 'scale(.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: 220, easing: 'cubic-bezier(.3,1.4,.5,1)' }
        );
      }
    }

    function build() {
      var s = current();
      placed = [];
      slots.innerHTML = '';
      bank.innerHTML = '';
      verdict.clear();
      zh.textContent = '中文意思：' + s.zh;
      nextBtn.style.display = 'none';
      checkBtn.disabled = false;
      emptyHint();
      syncMeta();

      C.shuffleDistinct(s.words).forEach(function (w) {
        var btn = C.el('button', { class: 'tile', type: 'button', text: w, 'aria-label': '选择单词 ' + w });
        btn.addEventListener('click', function () { place(w, btn); });
        bank.appendChild(btn);
      });
    }

    function check() {
      var s = current();
      if (placed.length !== s.words.length) {
        verdict.show(false, '还没排完', [{ text: '把所有单词都放进句子里再检查。' }]);
        return;
      }

      attempts += 1;
      syncMeta();

      var said = placed.map(function (p) { return p.word; }).join(' ');
      var ok = said.toLowerCase() === s.answer.toLowerCase();

      placed.forEach(function (p, i) {
        var right = s.answer.split(' ')[i];
        p.chip.classList.toggle('is-correct', ok || p.word === right);
        p.chip.classList.toggle('is-wrong', !ok && p.word !== right);
      });

      if (ok) {
        checkBtn.disabled = true;
        nextBtn.style.display = '';
        verdict.show(true, '完全正确', [
          { en: s.answer + '?', text: s.zh },
          { text: s.tip }
        ]);
        scoreOf(true, 12, slots);
      } else {
        verdict.show(false, '再看看语序', [{ text: s.tip }]);
        scoreOf(false, 0, null);
      }
    }

    checkBtn.addEventListener('click', check);
    resetBtn.addEventListener('click', build);
    nextBtn.addEventListener('click', function () { round += 1; attempts = 0; build(); });

    build();
    return function () {};
  }

  /* ======================================================================
     2. Multiple choice conversation quiz
     ====================================================================== */
  function mountQuiz(body, verdict) {
    var order = C.shuffle(D.quiz);
    var i = 0;
    var right = 0;
    var locked = false;

    headRow(body, '选出自然的回答', '选择你觉得最地道的一句');
    var meta = metaRow(body);
    var pips = C.el('div', { class: 'pips', 'aria-hidden': 'true' });
    meta.appendChild(pips);

    var prompt = C.el('div', { class: 'prompt' });
    var options = C.el('div', { class: 'options' });
    var actions = C.el('div', { class: 'game__actions' });

    body.appendChild(prompt);
    body.appendChild(options);
    body.appendChild(actions);

    var nextBtn = C.el('button', { class: 'btn btn--warm btn--sm', type: 'button', text: '下一题' });
    nextBtn.style.display = 'none';
    actions.appendChild(nextBtn);

    function drawPips() {
      pips.innerHTML = '';
      order.forEach(function (_, n) {
        var mark = C.el('i');
        if (n < i) mark.classList.add('is-done');
        pips.appendChild(mark);
      });
    }

    function finish() {
      prompt.innerHTML = '';
      options.innerHTML = '';
      nextBtn.style.display = 'none';

      var card = C.el('div', { class: 'word-card' });
      card.appendChild(C.el('div', { class: 'word-card__en', text: right + ' / ' + order.length }));
      card.appendChild(C.el('p', {
        class: 'prompt__zh',
        text: right === order.length ? '全对，语感很稳。' : '答对 ' + right + ' 题，继续保持。'
      }));
      prompt.appendChild(card);

      var again = C.el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: '再玩一次' });
      again.addEventListener('click', function () {
        order = C.shuffle(D.quiz);
        i = 0; right = 0; locked = false;
        verdict.clear();
        render();
      });
      options.appendChild(again);
      if (right > 0) C.burst(card, 16);
    }

    function render() {
      if (i >= order.length) { finish(); return; }
      locked = false;
      drawPips();
      verdict.clear();
      nextBtn.style.display = 'none';

      var q = order[i];
      prompt.innerHTML = '';
      prompt.appendChild(C.el('div', { class: 'prompt__who', text: q.who }));
      prompt.appendChild(C.el('div', { class: 'prompt__say', text: q.say }));
      prompt.appendChild(C.el('div', { class: 'prompt__zh', text: q.zh }));

      options.innerHTML = '';
      var keys = ['A', 'B', 'C', 'D'];

      C.shuffle(q.options).forEach(function (opt, n) {
        var btn = C.el('button', { class: 'option', type: 'button' });
        btn.appendChild(C.el('span', { class: 'option__key', text: keys[n] }));
        btn.appendChild(C.el('span', { class: 'en', text: opt.en }));

        btn.addEventListener('click', function () {
          if (locked) return;
          locked = true;

          C.$$('.option', options).forEach(function (b) { b.disabled = true; });
          btn.classList.add(opt.ok ? 'is-right' : 'is-wrong');

          if (!opt.ok) {
            C.$$('.option', options).forEach(function (b) {
              if (b.textContent.indexOf(q.options.filter(function (o) { return o.ok; })[0].en) > -1) {
                b.classList.add('is-right');
              } else if (b !== btn) {
                b.classList.add('is-faded');
              }
            });
          }

          if (opt.ok) right += 1;
          verdict.show(opt.ok, opt.ok ? '答对了' : '这样说更自然', [{ text: q.note }]);
          scoreOf(opt.ok, 10, btn);

          pips.children[i] && pips.children[i].classList.add(opt.ok ? 'is-right' : 'is-wrong');
          nextBtn.style.display = '';
          nextBtn.focus();
        });

        options.appendChild(btn);
      });

      if (C.motion.enabled) {
        prompt.animate(
          [{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'none' }],
          { duration: 360, easing: 'cubic-bezier(.2,.8,.28,1)' }
        );
      }
    }

    nextBtn.addEventListener('click', function () { i += 1; render(); });

    render();
    return function () {};
  }

  /* ======================================================================
     3. Vocabulary rush — timed, generous (running out just moves on)
     ====================================================================== */
  function mountRush(body, verdict) {
    var LIMIT = 12000;
    var order = C.shuffle(D.vocab);
    var i = 0;
    var right = 0;
    var locked = false;
    var startedAt = 0;
    var stopLoop = null;

    headRow(body, '快速词汇', '12 秒内选出正确的中文意思');
    var meta = metaRow(body);

    var timer = C.el('div', { class: 'timer' });
    var timerFill = C.el('i');
    timer.appendChild(timerFill);

    var card = C.el('div', { class: 'word-card' });
    var options = C.el('div', { class: 'options options--grid' });
    var actions = C.el('div', { class: 'game__actions' });

    body.appendChild(timer);
    body.appendChild(card);
    body.appendChild(options);
    body.appendChild(actions);

    var nextBtn = C.el('button', { class: 'btn btn--warm btn--sm', type: 'button', text: '下一个' });
    nextBtn.style.display = 'none';
    actions.appendChild(nextBtn);

    function syncMeta() {
      meta.innerHTML = '';
      meta.appendChild(C.el('span', { html: '第 <b>' + Math.min(i + 1, order.length) + '</b> / ' + order.length + ' 个' }));
      meta.appendChild(C.el('span', { html: '答对 <b class="tnum">' + right + '</b>' }));
      meta.appendChild(C.el('span', { html: '连对 <b class="tnum">' + C.progress.streak + '</b>' }));
    }

    function stopTimer() {
      if (stopLoop) { stopLoop(); stopLoop = null; }
    }

    function runTimer() {
      stopTimer();
      startedAt = performance.now();
      timer.classList.remove('is-low');
      timerFill.style.setProperty('--t', 1);

      if (!C.motion.enabled) return; /* reduced motion: untimed, no pressure */

      stopLoop = C.addTask(function (now) {
        var left = 1 - (now - startedAt) / LIMIT;
        if (left <= 0) {
          timerFill.style.setProperty('--t', 0);
          stopTimer();
          if (!locked) timeUp();
          return;
        }
        timer.classList.toggle('is-low', left < 0.3);
        timerFill.style.setProperty('--t', left.toFixed(3));
      });
    }

    function timeUp() {
      locked = true;
      var w = order[i];
      C.$$('.option', options).forEach(function (b) {
        b.disabled = true;
        if (b.dataset.v === w.answer) b.classList.add('is-right');
      });
      verdict.show(false, '时间到', [{ en: w.en, text: '意思是「' + w.answer + '」，记住它。' }]);
      scoreOf(false, 0, null);
      syncMeta();
      nextBtn.style.display = '';
    }

    function finish() {
      stopTimer();
      card.innerHTML = '';
      options.innerHTML = '';
      nextBtn.style.display = 'none';
      timerFill.style.setProperty('--t', 0);

      card.appendChild(C.el('div', { class: 'word-card__en', text: right + ' / ' + order.length }));
      card.appendChild(C.el('p', { class: 'prompt__zh', text: '最长连对 ' + C.progress.bestStreak + ' 次。' }));

      var again = C.el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: '再来一轮' });
      again.addEventListener('click', function () {
        order = C.shuffle(D.vocab);
        i = 0; right = 0;
        verdict.clear();
        render();
      });
      options.appendChild(again);
      if (right > 0) C.burst(card, 16);
    }

    function render() {
      if (i >= order.length) { finish(); return; }
      locked = false;
      verdict.clear();
      nextBtn.style.display = 'none';
      syncMeta();

      var w = order[i];
      card.innerHTML = '';
      card.appendChild(C.el('div', { class: 'word-card__en', text: w.en }));
      card.appendChild(C.el('div', { class: 'word-card__ipa ipa', text: w.ipa }));

      options.innerHTML = '';
      C.shuffle(w.options).forEach(function (opt) {
        var btn = C.el('button', { class: 'option', type: 'button', 'data-v': opt });
        btn.appendChild(C.el('span', { class: 'option__key', text: '·' }));
        btn.appendChild(C.el('span', { text: opt }));

        btn.addEventListener('click', function () {
          if (locked) return;
          locked = true;
          stopTimer();

          var ok = opt === w.answer;
          C.$$('.option', options).forEach(function (b) {
            b.disabled = true;
            if (b.dataset.v === w.answer) b.classList.add('is-right');
            else if (b === btn) b.classList.add('is-wrong');
            else b.classList.add('is-faded');
          });

          if (ok) right += 1;
          verdict.show(ok, ok ? '正确' : '再记一次', [
            { en: w.en, text: '意思是「' + w.answer + '」' }
          ]);
          scoreOf(ok, 8, btn);
          syncMeta();
          nextBtn.style.display = '';
        });

        options.appendChild(btn);
      });

      runTimer();

      if (C.motion.enabled) {
        card.animate(
          [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(.2,.8,.28,1)' }
        );
      }
    }

    nextBtn.addEventListener('click', function () { i += 1; render(); });

    render();
    return function () { stopTimer(); };
  }

  /* ======================================================================
     4. Listening cloze — SpeechSynthesis, with a written fallback
     ====================================================================== */
  function mountListen(body, verdict) {
    var order = C.shuffle(D.listening);
    var i = 0;
    var right = 0;
    var locked = false;
    var wave = null;
    var detachWave = null;

    headRow(body, '听音填空', '点击播放，选出你听到的词');
    var meta = metaRow(body);

    var listen = C.el('div', { class: 'listen' });
    var canvas = C.el('canvas', { class: 'listen__wave', id: 'listenWave', 'aria-hidden': 'true' });
    var playBtn = C.el('button', { class: 'btn btn--primary btn--sm speak-btn', type: 'button' });
    playBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>';
    playBtn.appendChild(document.createTextNode(' 播放句子'));

    var cloze = C.el('p', { class: 'cloze' });
    var options = C.el('div', { class: 'options options--grid' });
    var actions = C.el('div', { class: 'game__actions' });

    listen.appendChild(canvas);
    listen.appendChild(playBtn);
    body.appendChild(listen);
    body.appendChild(cloze);
    body.appendChild(options);
    body.appendChild(actions);

    var nextBtn = C.el('button', { class: 'btn btn--warm btn--sm', type: 'button', text: '下一句' });
    nextBtn.style.display = 'none';
    actions.appendChild(nextBtn);

    wave = C.makeWave(canvas, { bars: 40 });
    detachWave = wave.attach(listen);

    var supported = C.speech.supported;

    if (!supported) {
      playBtn.disabled = true;
      var fallback = C.el('p', { class: 'no-tts' });
      listen.appendChild(fallback);
    }

    function syncMeta() {
      meta.innerHTML = '';
      meta.appendChild(C.el('span', { html: '第 <b>' + Math.min(i + 1, order.length) + '</b> / ' + order.length + ' 句' }));
      meta.appendChild(C.el('span', { html: '答对 <b class="tnum">' + right + '</b>' }));
    }

    function speak() {
      var item = order[i];
      if (!item) return;
      var spoken = C.speech.say(item.full, {
        onstart: function () { wave.setLevel(0.9); },
        onend: function () { wave.setLevel(0); }
      });
      if (!spoken) {
        wave.setLevel(0.8);
        setTimeout(function () { wave.setLevel(0); }, 900);
      }
    }

    function showFallbackText(item) {
      var note = C.$('.no-tts', listen);
      if (!note) return;
      /* without TTS the exercise becomes a written one — never a dead end */
      note.textContent = '当前浏览器不支持语音朗读，已改为文字模式：' +
        item.full.replace(item.gap, '____');
    }

    function finish() {
      cloze.innerHTML = '';
      options.innerHTML = '';
      nextBtn.style.display = 'none';
      playBtn.disabled = true;

      cloze.textContent = '完成：' + right + ' / ' + order.length;

      var again = C.el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: '再听一轮' });
      again.addEventListener('click', function () {
        order = C.shuffle(D.listening);
        i = 0; right = 0;
        playBtn.disabled = !supported;
        verdict.clear();
        render();
      });
      options.appendChild(again);
      if (right > 0) C.burst(cloze, 14);
    }

    function render() {
      if (i >= order.length) { finish(); return; }
      locked = false;
      verdict.clear();
      nextBtn.style.display = 'none';
      syncMeta();

      var item = order[i];

      cloze.innerHTML = '';
      var parts = item.full.split(item.gap);
      cloze.appendChild(document.createTextNode(parts[0]));
      cloze.appendChild(C.el('b', { text: '____' }));
      cloze.appendChild(document.createTextNode(parts[1] || ''));

      if (!supported) showFallbackText(item);

      options.innerHTML = '';
      C.shuffle(item.options).forEach(function (opt) {
        var btn = C.el('button', { class: 'option', type: 'button', 'data-v': opt });
        btn.appendChild(C.el('span', { class: 'option__key', text: '·' }));
        btn.appendChild(C.el('span', { class: 'en', text: opt }));

        btn.addEventListener('click', function () {
          if (locked) return;
          locked = true;

          var ok = opt === item.gap;
          C.$$('.option', options).forEach(function (b) {
            b.disabled = true;
            if (b.dataset.v === item.gap) b.classList.add('is-right');
            else if (b === btn) b.classList.add('is-wrong');
            else b.classList.add('is-faded');
          });

          C.$('b', cloze).textContent = item.gap;

          if (ok) right += 1;
          verdict.show(ok, ok ? '听对了' : '再听一遍', [
            { en: item.full, text: item.zh }
          ]);
          scoreOf(ok, 10, btn);
          syncMeta();
          nextBtn.style.display = '';
        });

        options.appendChild(btn);
      });

      if (supported) setTimeout(speak, 260);
    }

    playBtn.addEventListener('click', speak);
    nextBtn.addEventListener('click', function () { i += 1; render(); });

    render();

    return function () {
      if (C.speech.supported) window.speechSynthesis.cancel();
      if (detachWave) detachWave();
    };
  }

  /* ---------- game registry ---------------------------------------------- */
  var games = [
    { id: 'builder', label: '排句子', mount: mountBuilder },
    { id: 'quiz', label: '选回答', mount: mountQuiz },
    { id: 'rush', label: '记词汇', mount: mountRush },
    { id: 'listen', label: '听音填空', mount: mountListen }
  ];

  /* ---------- progress rail ---------------------------------------------- */
  function initRail() {
    var host = C.$('#rail');
    if (!host) return;

    var pointsOut = C.$('#railPoints');
    var streakOut = C.$('#railStreak');
    var doneOut = C.$('#railDone');
    var starsOut = C.$('#railStars');
    var barOut = C.$('#railBar');
    var msgOut = C.$('#railMsg');

    C.progress.subscribe(function (p) {
      if (pointsOut) pointsOut.textContent = p.points;
      if (streakOut) streakOut.textContent = p.streak;
      if (doneOut) doneOut.textContent = p.done;

      if (starsOut) {
        C.$$('i', starsOut).forEach(function (s, n) {
          var lit = n < p.stars;
          if (lit && !s.classList.contains('is-lit') && C.motion.enabled) {
            s.animate([{ transform: 'scale(0.4)' }, { transform: 'scale(1)' }],
              { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
          }
          s.classList.toggle('is-lit', lit);
        });
      }

      if (barOut) barOut.style.setProperty('--v', Math.min(1, (p.points % 40) / 40).toFixed(3));

      if (msgOut) {
        var msg;
        if (p.done === 0) msg = D.cheers[0];
        else if (p.streak >= 3) msg = D.cheers[2];
        else if (p.streak >= 1) msg = D.cheers[1];
        else if (p.done >= 6) msg = D.cheers[4];
        else msg = D.cheers[3];
        msgOut.textContent = msg;
      }
    });
  }

  /* ---------- tabbed shell ------------------------------------------------ */
  function initArena() {
    var tabsHost = C.$('#gameTabs');
    var bodyHost = C.$('#gameBody');
    if (!tabsHost || !bodyHost) return;

    var verdict = null;

    function open(id) {
      var game = games.filter(function (g) { return g.id === id; })[0];
      if (!game) return;

      if (teardown) { teardown(); teardown = null; }
      bodyHost.innerHTML = '';

      C.$$('.tab', tabsHost).forEach(function (t) {
        t.setAttribute('aria-selected', t.dataset.id === id ? 'true' : 'false');
      });

      verdict = verdictBox(bodyHost);          /* live region first, so SRs see it */
      var mountPoint = C.el('div', { class: 'game__stack' });
      bodyHost.insertBefore(mountPoint, verdict.node);

      teardown = game.mount(mountPoint, verdict) || function () {};

      if (C.motion.enabled) {
        bodyHost.animate(
          [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: 340, easing: 'cubic-bezier(.2,.8,.28,1)' }
        );
      }
    }

    games.forEach(function (g, i) {
      var tab = C.el('button', {
        class: 'tab',
        type: 'button',
        role: 'tab',
        'data-id': g.id,
        'aria-selected': i === 0 ? 'true' : 'false'
      });
      tab.appendChild(C.el('i', { 'aria-hidden': 'true' }));
      tab.appendChild(C.el('span', { text: g.label }));
      tab.addEventListener('click', function () { open(g.id); });

      tab.addEventListener('keydown', function (e) {
        var all = C.$$('.tab', tabsHost);
        var here = all.indexOf(tab);
        var next = null;
        if (e.key === 'ArrowRight') next = all[(here + 1) % all.length];
        if (e.key === 'ArrowLeft') next = all[(here - 1 + all.length) % all.length];
        if (next) { e.preventDefault(); next.focus(); next.click(); }
      });

      tabsHost.appendChild(tab);
    });

    open(games[0].id);
  }

  /* the "quick game" teaser above the fold jumps into the full arena */
  function initTeaser() {
    var btn = C.$('#teaserJump');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var target = document.getElementById('challenge');
      if (target) target.scrollIntoView({ behavior: C.motion.enabled ? 'smooth' : 'auto', block: 'start' });
    });
  }

  LC.games = {
    init: function () {
      initRail();
      initArena();
      initTeaser();
    }
  };
})();
