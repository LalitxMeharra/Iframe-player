(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     Theme toggle
     (initial theme is already set on <html> by the inline script in
     index.html — this just wires up the button and keeps it in sync)
  --------------------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'dojo-stream-theme';

  function syncToggleA11y(theme) {
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  syncToggleA11y(root.getAttribute('data-theme') || 'light');

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    syncToggleA11y(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* storage unavailable — theme just won't persist */ }
  });

  /* ---------------------------------------------------------------------
     Elements
  --------------------------------------------------------------------- */
  const urlInput = document.getElementById('urlInput');
  const playBtn = document.getElementById('playBtn');
  const clearBtn = document.getElementById('clearBtn');
  const errorToast = document.getElementById('errorToast');
  const stage = document.getElementById('stage');
  const stageFrame = document.getElementById('stageFrame');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  let errorTimer = null;

  /* ---------------------------------------------------------------------
     Helpers
  --------------------------------------------------------------------- */
  function showError(message) {
    errorToast.textContent = message;
    errorToast.classList.add('is-visible');
    urlInput.classList.add('has-error');

    stage.classList.remove('is-shaking');
    // restart the shake animation even if it just fired
    void stage.offsetWidth;
    stage.classList.add('is-shaking');

    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorToast.classList.remove('is-visible'), 4500);
  }

  function clearError() {
    errorToast.classList.remove('is-visible');
    urlInput.classList.remove('has-error');
  }

  function decodeHtmlEntities(str) {
    const box = document.createElement('textarea');
    box.innerHTML = str;
    return box.value;
  }

  // Pulls the src out of a pasted <iframe> tag, or falls back to treating
  // the whole input as a plain URL.
  function extractUrl(raw) {
    const value = raw.trim();
    if (!value) return null;

    const iframeMatch = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    if (iframeMatch) return decodeHtmlEntities(iframeMatch[1].trim());

    return value;
  }

  function tryParseUrl(candidate) {
    try {
      const parsed = new URL(candidate);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }

  function normalizeUrl(candidate) {
    let str = candidate.trim();
    if (str.startsWith('//')) str = 'https:' + str;

    let result = tryParseUrl(str);
    if (result) return result;

    // No scheme at all, e.g. "streamhost.example/embed/123" — assume https.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(str)) {
      result = tryParseUrl('https://' + str);
      if (result) return result;
    }

    return null;
  }

  function setStatus(state) {
    statusDot.setAttribute('data-state', state);
    statusText.textContent = state;
  }

  /* ---------------------------------------------------------------------
     Core actions
  --------------------------------------------------------------------- */
  function playStream() {
    const extracted = extractUrl(urlInput.value);

    if (!extracted) {
      showError('Paste a stream link or an <iframe> embed code first.');
      return;
    }

    const finalUrl = normalizeUrl(extracted);
    if (!finalUrl) {
      showError("That doesn't look like a playable link.");
      return;
    }

    clearError();
    loadStream(finalUrl);
  }

  function loadStream(src) {
    stageFrame.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'Stream playback';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    // Scripts stay allowed so third-party players can actually run, but
    // top-level navigation and popups stay blocked — this stops shady
    // embeds from hijacking the tab or spawning ad windows.
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');

    stageFrame.appendChild(iframe);
    stage.classList.add('is-active');
    clearBtn.disabled = false;
    setStatus('playing');
  }

  function clearStream() {
    stageFrame.innerHTML = '';
    stage.classList.remove('is-active');
    clearBtn.disabled = true;
    setStatus('idle');
    urlInput.value = '';
    urlInput.focus();
  }

  /* ---------------------------------------------------------------------
     Events
  --------------------------------------------------------------------- */
  playBtn.addEventListener('click', playStream);
  clearBtn.addEventListener('click', clearStream);

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      playStream();
    }
  });

  urlInput.addEventListener('input', clearError);
})();
