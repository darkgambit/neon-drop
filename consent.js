/* =============================================================
   consent.js — cookie consent gate for advertising.

   Why this exists: privacy.html states that a consent banner is shown before
   personalised advertising cookies are set. That claim has to be TRUE, not
   aspirational — and Adsterra's banners do set third-party cookies (measured:
   15-21 per page load). So the ad scripts are gated on consent recorded here.

   Loaded SYNCHRONOUSLY in <head>, BEFORE any ad slot, so that ads-site.js can
   read the decision at parse time. If consent is missing, no ad script is
   written at all — the visitor gets a clean page, which is the correct default.

   First visit  : banner shown, no ads.
   Accept       : stored, page reloads, ads render from the first paint.
   Decline      : stored, no ads ever. The choice is remembered.

   Self-contained: it injects its own styles so no other file needs touching.
   Not loaded on /game/* — the game is embedded by portals that handle their
   own consent, and it must stay a clean, ad-free build.
   ============================================================= */
(function () {
  var KEY = 'nd_ad_consent';
  var choice = null;
  try { choice = window.localStorage.getItem(KEY); } catch (e) { choice = null; }

  window.__adConsent = choice === 'granted';

  function store(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }

  function banner() {
    var css = document.createElement('style');
    css.textContent =
      '#ndConsent{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#0a1622;' +
      'border-top:1px solid rgba(160,220,255,.22);color:#eafcff;font:14px/1.55 system-ui,' +
      '-apple-system,Segoe UI,Roboto,sans-serif;padding:14px 18px;display:flex;gap:14px;' +
      'align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -8px 24px rgba(0,0,0,.35)}' +
      '#ndConsent p{margin:0;max-width:620px;color:#c8e2f0}' +
      // Underlined, not colour-only. A link that is distinguishable only by its
      // colour fails Lighthouse's `link-in-text-block` (weight 7) and, more to
      // the point, is invisible to anyone who cannot separate the two hues.
      '#ndConsent a{color:#40c4ff;text-decoration:underline}' +
      '#ndConsent button{font:inherit;font-weight:600;border-radius:999px;padding:9px 20px;' +
      'cursor:pointer;border:1px solid rgba(160,220,255,.3);background:transparent;color:#eafcff}' +
      '#ndConsent .acc{background:#1de9b6;border-color:#1de9b6;color:#04121a}' +
      '@media(max-width:520px){#ndConsent{padding:12px 14px}#ndConsent button{flex:1}}';
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.id = 'ndConsent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Advertising consent');
    el.innerHTML =
      '<p>This site is free because of advertising. Our ad partner sets cookies to ' +
      'deliver and measure ads. See the <a href="/privacy.html">privacy policy</a>.</p>' +
      '<button class="acc" type="button">Accept</button>' +
      '<button type="button" data-decline>Decline</button>';
    document.body.appendChild(el);

    el.querySelector('.acc').addEventListener('click', function () {
      store('granted');
      window.location.reload();
    });
    el.querySelector('[data-decline]').addEventListener('click', function () {
      store('denied');
      el.remove();
    });
  }

  if (choice !== 'granted' && choice !== 'denied') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', banner);
    } else {
      banner();
    }
  }
})();
