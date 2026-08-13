/**
 * 🌸 秘密花园彩蛋
 * 入口 1：搜索框输入 "nimo" 触发传送
 * 入口 2：连续点击站名 logo 5 次触发传送
 */
(function () {
  'use strict';

  var SECRET_URL = 'secret/garden.html';

  function goSecret() {
    if (window.location.href.indexOf('secret/garden') !== -1) return;
    window.location.href = SECRET_URL;
  }

  /* ---------- 入口 1：搜索框输入 nimo ---------- */
  var searchInput = document.querySelector('.md-search__input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var v = (searchInput.value || '').trim().toLowerCase();
      if (v === 'nimo') {
        goSecret();
      }
    });
  }

  /* ---------- 入口 2：连续点击 logo 5 次 ---------- */
  // logo 是 <a> 链接，点击会触发导航导致 JS 状态丢失，
  // 所以用 sessionStorage 持久化计数（跨页面导航保留）。
  var logo = document.querySelector('.md-header__button.md-logo');
  var KEY = 'nimo-garden-logo-clicks';
  var clicks = parseInt(sessionStorage.getItem(KEY) || '0', 10);
  var lastTime = parseInt(sessionStorage.getItem('nimo-garden-logo-last') || '0', 10);
  if (logo) {
    logo.addEventListener('click', function () {
      var now = Date.now();
      // 5 秒内没继续点就重新计数（真人连点远快于此）
      if (now - lastTime > 5000) clicks = 0;
      lastTime = now;
      clicks += 1;
      sessionStorage.setItem(KEY, String(clicks));
      sessionStorage.setItem('nimo-garden-logo-last', String(now));
      if (clicks >= 5) {
        clicks = 0;
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem('nimo-garden-logo-last');
        goSecret();
      }
    });
  }
})();
