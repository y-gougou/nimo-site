/**
 * 🌸 秘密花园彩蛋
 * 入口 1：搜索框输入 "nimo" 触发传送
 * 入口 2：点击站名 logo 5 次触发传送（带进度提示）
 *
 * 设计说明：
 * - logo 点击用 document 级事件委托绑定，页面切换（Material instant
 *   navigation 只替换 main 内容）后依然可靠，不需要重新绑定。
 * - 计数存 sessionStorage，跨页面导航保留；30 秒内未继续点击才重置，
 *   真人慢慢点 5 下也能触发。
 * - 每次点击在 logo 旁显示「🌸 n/5」气泡，让彩蛋有反馈、可感知。
 */
(function () {
  'use strict';

  var KEY = 'nimo-garden-logo-clicks';
  var LAST = 'nimo-garden-logo-last';
  var MAX_CLICKS = 5;
  var RESET_MS = 30000; // 30 秒

  /**
   * 站点根路径：从 logo 链接取绝对根（如 https://y-gougou.github.io/nimo-site/）。
   * 不能写死相对路径——在子页面（/course/01-package/）相对跳转会 404。
   * 取不到时退回相对路径（本地预览兜底）。
   */
  function getRoot() {
    var logo = document.querySelector('.md-header__button.md-logo');
    if (logo) {
      var href = logo.getAttribute('href') || '';
      if (href && href !== '#') {
        return href.charAt(href.length - 1) === '/' ? href : href + '/';
      }
    }
    var base = document.querySelector('base');
    if (base && base.getAttribute('href')) {
      var b = base.getAttribute('href');
      return b.charAt(b.length - 1) === '/' ? b : b + '/';
    }
    return '';
  }

  function goSecret() {
    if (window.location.href.indexOf('secret/garden') !== -1) return;
    window.location.href = getRoot() + 'secret/garden.html';
  }

  function isLogo(el) {
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('md-logo')) return true;
      el = el.parentElement;
    }
    return false;
  }

  /* ---------- 入口 1：搜索框输入 nimo ---------- */
  // 同样用委托 + 轮询兜底：Material 搜索框是动态渲染的
  function bindSearch() {
    var input = document.querySelector('.md-search__input');
    if (!input) return;
    input.addEventListener('input', function () {
      var v = (input.value || '').trim().toLowerCase();
      if (v === 'nimo') {
        goSecret();
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSearch);
  } else {
    bindSearch();
  }
  // Material instant navigation 后 main 内容被替换，搜索框在 header 中不受影响；
  // 但保险起见在每次点击 logo 时也尝试补绑（幂等）
  setInterval(function () {
    var input = document.querySelector('.md-search__input');
    if (input && !input.dataset.nimoBound) {
      input.dataset.nimoBound = '1';
      input.addEventListener('input', function () {
        var v = (input.value || '').trim().toLowerCase();
        if (v === 'nimo') {
          goSecret();
        }
      });
    }
  }, 2000);

  /* ---------- 入口 2：点击 logo 5 次（事件委托） ---------- */
  function showProgress(n) {
    var old = document.querySelector('.nimo-egg-progress');
    if (old) old.remove();
    if (n >= MAX_CLICKS) return;
    var logo = document.querySelector('.md-header__button.md-logo');
    if (!logo) return;
    var bubble = document.createElement('span');
    bubble.className = 'nimo-egg-progress';
    bubble.textContent = '🌸 ' + n + '/' + MAX_CLICKS;
    bubble.style.cssText =
      'position:fixed;top:12px;left:96px;z-index:9999;background:rgba(45,212,191,.15);' +
      'color:#2dd4bf;border:1px solid rgba(45,212,191,.4);border-radius:999px;' +
      'padding:2px 10px;font-size:12px;pointer-events:none;' +
      'font-family:ui-sans-serif,system-ui,sans-serif;transition:opacity .4s;';
    document.body.appendChild(bubble);
    setTimeout(function () { bubble.style.opacity = '0'; }, 900);
    setTimeout(function () { if (bubble.parentNode) bubble.parentNode.removeChild(bubble); }, 1400);
  }

  // Material 的 instant navigation 会在 document 级监听 click 并覆盖 <a> 的
  // location.href（无刷新切换）。实测单靠捕获阶段 stopPropagation 拦不住——
  // bundle 的监听器注册得更早。解法组合：
  //   1. 捕获阶段 + stopImmediatePropagation()：阻止同元素后续监听器执行
  //   2. 延迟 ~50ms 跳转：让 Material 的同步处理先跑完，我们的跳转最后生效
  var logo = document.querySelector('.md-header__button.md-logo');
  if (logo) {
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      var now = Date.now();
      var clicks = parseInt(sessionStorage.getItem(KEY) || '0', 10);
      var last = parseInt(sessionStorage.getItem(LAST) || '0', 10);
      if (now - last > RESET_MS) clicks = 0;
      last = now;
      clicks += 1;
      sessionStorage.setItem(KEY, String(clicks));
      sessionStorage.setItem(LAST, String(now));
      if (clicks >= MAX_CLICKS) {
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem(LAST);
        // 延迟跳转，绕开 Material instant navigation 的同步覆盖
        setTimeout(goSecret, 50);
      } else {
        showProgress(clicks);
        // 保持 logo 原功能：点击回首页（手动导航，绕过 instant navigation 冲突）
        var root = getRoot();
        // 已经在根路径时不重复导航（避免整页刷新闪烁）
        var cur = window.location.href;
        var curPath = cur.replace(/\/$/, '');
        var rootPath = root.replace(/\/$/, '');
        if (curPath !== rootPath) {
          setTimeout(function () { window.location.href = root; }, 50);
        }
      }
    }, true); // capture 阶段，先于 Material 的 document 级监听器
  }
})();
