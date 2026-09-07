/* Abdurrahmaan Lakhota — portfolio
   Progressive enhancement only. Nothing here renders content: with JavaScript
   disabled the page is fully readable, navigable and printable. */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* --- Theme ------------------------------------------------------------ */
  /* The <head> bootstrap has already applied any stored preference so there
     is no flash; this only wires up the toggle and keeps the label honest. */

  var STORAGE_KEY = 'al-theme';
  var toggle = document.getElementById('theme-toggle');

  function systemPrefersDark() {
    return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  }

  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark' || set === 'light') return set;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function syncLabel(theme) {
    if (!toggle) return;
    toggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }

  if (toggle) {
    syncLabel(currentTheme());

    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      syncLabel(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* private mode */ }
    });

    /* Follow the OS while the visitor has expressed no preference of their own. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        var stored = null;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (stored !== 'dark' && stored !== 'light') {
          root.removeAttribute('data-theme');
          syncLabel(currentTheme());
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* --- Mobile navigation ------------------------------------------------ */

  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  /* --- Header hairline once the page has scrolled ----------------------- */

  var header = document.getElementById('site-header');

  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --- Reveal sections on scroll ---------------------------------------- */

  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));

  function revealAll() {
    sections.forEach(function (section) { section.classList.remove('reveal'); });
  }

  if (sections.length && 'IntersectionObserver' in window) {
    sections.forEach(function (section) { section.classList.add('reveal'); });

    var observerRan = false;

    var revealObserver = new IntersectionObserver(function (entries) {
      observerRan = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.03 });

    try {
      sections.forEach(function (section) { revealObserver.observe(section); });
    } catch (e) {
      revealAll();
    }

    /* Failsafe: the observer delivers an initial callback for every target,
       intersecting or not. If that never arrives the implementation is broken,
       so drop the effect rather than leave content permanently invisible.
       (Checking for "nothing visible yet" instead would misfire on every load,
       since the hero fills the viewport and no section starts in view.) */
    window.setTimeout(function () {
      if (!observerRan) revealAll();
    }, 1500);

    /* Belt and braces alongside the print stylesheet: Ctrl+P from an unscrolled
       page must never print blank sections. */
    if (window.matchMedia) {
      var printMq = window.matchMedia('print');
      var onPrint = function (e) { if (!e || e.matches) revealAll(); };
      if (printMq.addEventListener) printMq.addEventListener('change', onPrint);
      else if (printMq.addListener) printMq.addListener(onPrint);
    }
    window.addEventListener('beforeprint', function () { revealAll(); });
  }

  /* --- Active navigation link -------------------------------------------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var visible = {};

    var setActive = function () {
      var id = null;
      for (var i = 0; i < targets.length; i++) {
        if (visible[targets[i].id]) { id = targets[i].id; break; }
      }
      links.forEach(function (link) {
        var on = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      setActive();
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });

    targets.forEach(function (target) { navObserver.observe(target); });
  }

  /* --- Footer year -------------------------------------------------------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
