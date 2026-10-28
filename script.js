/* Abdurrahmaan Lakhota — portfolio
   Progressive enhancement only. Nothing here renders content: with JavaScript
   disabled the page is fully readable, navigable and printable. */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* --- Theme: System / Dark / Light in the footer ------------------------- */
  /* The <head> bootstrap has already applied any stored choice, so there is
     no flash. "System" clears the stored choice and follows the OS. */

  var STORAGE_KEY = 'al-theme';
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-choice]'));

  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function applyTheme(choice) {
    if (choice === 'dark' || choice === 'light') {
      root.setAttribute('data-theme', choice);
      try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) { /* private mode */ }
    } else {
      root.removeAttribute('data-theme');
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      choice = 'system';
    }
    themeButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-choice') === choice ? 'true' : 'false');
    });
  }

  if (themeButtons.length) {
    var s = storedTheme();
    applyTheme(s === 'dark' || s === 'light' ? s : 'system');
    themeButtons.forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.getAttribute('data-theme-choice')); });
    });
  }

  /* --- Mobile navigation ------------------------------------------------ */

  var menuBtn = document.getElementById('menu-btn');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    /* Leaving the narrow layout with the menu open must not leave the page locked. */
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 768px)');
      var onWide = function () { if (wide.matches) setMenu(false); };
      if (wide.addEventListener) wide.addEventListener('change', onWide);
      else if (wide.addListener) wide.addListener(onWide);
    }
  }

  /* --- Active navigation link -------------------------------------------- */

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (targets.length && hasIO) {
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
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      setActive();
    }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });
    targets.forEach(function (target) { navObserver.observe(target); });
  }

  /* --- Scroll reveals: rise and fade in once ------------------------------ */
  /* Only switched on when IntersectionObserver exists, so nothing can stay
     hidden. Print CSS forces everything visible, and so does beforeprint. */

  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function revealAll() {
    reveals.forEach(function (el) { el.classList.add('in'); });
    words.forEach(function (w) { w.classList.add('on'); });
  }

  if (reveals.length && hasIO) {
    root.classList.add('reveals');
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --- Tagline: each word lights up as it crosses a line on the screen ---- */

  var tagline = document.getElementById('tagline');
  var words = [];

  if (tagline) {
    var parts = tagline.textContent.trim().split(/\s+/);
    tagline.textContent = '';
    parts.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      tagline.appendChild(span);
      if (i < parts.length - 1) tagline.appendChild(document.createTextNode(' '));
      words.push(span);
    });

    if (reduceMotion || !hasIO) {
      words.forEach(function (w) { w.classList.add('on'); });
    } else {
      /* The trigger line sits 35% up from the bottom of the screen; words are
         taken in reading order so they never light up out of sequence. */
      var lit = 0;
      var wordObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.dataset.past = '1';
        });
        while (lit < words.length && words[lit].dataset.past === '1') {
          words[lit].classList.add('on');
          wordObserver.unobserve(words[lit]);
          lit++;
        }
      }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });
      words.forEach(function (w) { wordObserver.observe(w); });
    }
  }

  window.addEventListener('beforeprint', revealAll);

  /* --- Copy email ----------------------------------------------------------- */

  var copyBtn = document.getElementById('copy-email');
  var copyStatus = document.getElementById('copy-status');

  if (copyBtn) {
    var label = copyBtn.querySelector('.copy-label');
    var timer = null;
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      var done = function () {
        copyBtn.classList.add('is-done');
        if (label) label.textContent = 'Copied';
        if (copyStatus) copyStatus.textContent = email + ' copied to your clipboard.';
        clearTimeout(timer);
        timer = setTimeout(function () {
          copyBtn.classList.remove('is-done');
          if (label) label.textContent = 'Copy email address';
          if (copyStatus) copyStatus.textContent = '';
        }, 2400);
      };
      var fail = function () {
        if (copyStatus) copyStatus.textContent = 'Copy is blocked here. The address is ' + email + '.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, fail);
      } else {
        fail();
      }
    });
  }

  /* --- Footer year -------------------------------------------------------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}());
