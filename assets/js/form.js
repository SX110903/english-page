/* ==========================================================================
   form.js — trial-class request.

   There is no backend in this project, so the form does NOT claim to send
   anything to a server. It validates the input and turns it into a ready-to-
   paste WeChat message, which is the channel this business actually uses.
   If a backend is added later, post to it inside `submit()` and keep the rest.
   ========================================================================== */

(function () {
  'use strict';

  var C = LC.core;

  var rules = {
    name: {
      test: function (v) { return v.trim().length >= 1; },
      msg: '请填写称呼，方便老师称呼您。'
    },
    grade: {
      test: function (v) { return v !== ''; },
      msg: '请选择孩子目前的年级。'
    },
    contact: {
      test: function (v) { return v.trim().length >= 4; },
      msg: '请填写微信号或手机号，至少 4 个字符。'
    }
  };

  function fieldOf(input) { return input.closest('.field'); }

  function setError(input, msg) {
    var field = fieldOf(input);
    if (!field) return;
    var out = C.$('.field__error', field);
    field.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg || '';
  }

  function validate(input) {
    var rule = rules[input.name];
    if (!rule) return true;
    var ok = rule.test(input.value);
    setError(input, ok ? '' : rule.msg);
    return ok;
  }

  function init() {
    var form = C.$('#trialForm');
    if (!form) return;

    var status = C.$('#formStatus');
    var submitBtn = C.$('#formSubmit');
    var inputs = C.$$('input, select', form).filter(function (n) { return rules[n.name]; });

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allOk = true;
      inputs.forEach(function (input) { if (!validate(input)) allOk = false; });

      if (!allOk) {
        var firstBad = C.$('.field.is-invalid input, .field.is-invalid select', form);
        if (firstBad) firstBad.focus();
        status.className = 'form__status is-shown';
        status.innerHTML = '';
        status.appendChild(C.el('p', { text: '还有几项需要补充，请看上面的提示。' }));
        return;
      }

      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '';
      submitBtn.appendChild(C.el('span', { class: 'spinner', 'aria-hidden': 'true' }));
      submitBtn.appendChild(document.createTextNode(' 正在整理…'));

      /* brief, honest pause: we are formatting the message, not calling a server */
      setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;

        var data = {};
        inputs.forEach(function (n) { data[n.name] = n.value.trim(); });

        var msg = '您好，我想给孩子预约一节免费试听课。' +
          '称呼：' + data.name +
          '；年级：' + data.grade +
          '；联系方式：' + data.contact + '。';

        status.className = 'form__status is-shown is-ok';
        status.innerHTML = '';
        status.appendChild(C.el('p', { html: '<b>信息已整理好。</b>下一步：添加老师微信并把下面这段话发过去，就可以约试听时间了。' }));

        var box = C.el('p', { class: 'en', text: msg });
        box.style.fontStyle = 'normal';
        box.style.fontFamily = 'var(--font-sans)';
        status.appendChild(box);

        var row = C.el('div', { class: 'game__actions' });

        var copyBtn = C.el('button', { class: 'btn btn--warm btn--sm', type: 'button', text: '复制这段话' });
        copyBtn.addEventListener('click', function () {
          function done() {
            copyBtn.textContent = '已复制';
            C.burst(copyBtn, 10);
            setTimeout(function () { copyBtn.textContent = '复制这段话'; }, 1600);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(msg).then(done, function () { window.prompt('复制内容：', msg); });
          } else {
            window.prompt('复制内容：', msg);
          }
        });

        var qrBtn = C.el('button', { class: 'btn btn--quiet btn--sm', type: 'button', text: '看二维码' });
        qrBtn.addEventListener('click', function () {
          var qr = C.$('#qrBlock');
          if (qr) qr.scrollIntoView({ behavior: C.motion.enabled ? 'smooth' : 'auto', block: 'center' });
        });

        row.appendChild(copyBtn);
        row.appendChild(qrBtn);
        status.appendChild(row);

        C.burst(submitBtn, 14);
        status.focus();
      }, 550);
    });
  }

  LC.form = { init: init };
})();
