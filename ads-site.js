/* =============================================================
   ads-site.js — Adsterra display banners for the CONTENT pages.

   Loaded SYNCHRONOUSLY at each ad slot. That is deliberate and not an
   oversight: Adsterra's invoke.js injects its iframe with document.write,
   which is only safe while the HTML parser is still active. Loading it
   after the page has finished parsing risks document.open() erasing the
   document. So the script must be placed inline at the slot, in document
   order, and must not be given defer/async.

   Usage — put this exactly where the ad should appear:

       <script src="/ads-site.js" data-ad="leader"></script>

   Slots (picked by viewport width so a wide banner never overflows a phone):

       leader  728x90 desktop  /  320x50 mobile   — index.html (1080px column)
       banner  468x60 desktop  /  320x50 mobile   — blog pages (720px column)
       rect    300x250 at every width             — in-content

   NOT used on /game/*. That build is embedded by portals that monetise the
   game themselves. Putting our own ads inside it would break the embed and
   breach their terms — and the same zip is uploaded to itch.io. The
   <div id="adTop"> in game/index.html is for the PORTAL's SDK to fill, not
   for Adsterra.

   Units are declared here rather than inline in the HTML so the keys live in
   one place. They are public (they appear in the page source by design);
   they are not secrets.
   ============================================================= */
(function () {
  var HOST = 'https://www.highrevenueformat.com/';

  var UNITS = {
    leader: { key: 'ea195481585cda608a5473ea655629f2', w: 728, h: 90 },
    banner: { key: '51b71eaa7c5c6e2783278929c096e210', w: 468, h: 60 },
    mobile: { key: '09e826ea0472cd384211a90e23a11fea', w: 320, h: 50 },
    rect:   { key: '743702bbd12151692c0084aff88afb14', w: 300, h: 250 }
  };

  // Remaining approved units, deliberately unused: 160x600 and 160x300 need a
  // sidebar this layout does not have, and stacking every size on one page is
  // both slow and hostile. Kept here so they are not lost.
  //   160x600  a33f4b0044dda27d1ce374ca75a38b2e
  //   160x300  be6ee45a7556a6516650a63c6db74016

  var me = document.currentScript;
  if (!me) return;

  // Consent gate. consent.js runs synchronously in <head> and sets this. No
  // consent -> no ad script is written at all, so nothing third-party loads.
  if (!window.__adConsent) return;

  var slot = me.getAttribute('data-ad');
  var w = window.innerWidth || document.documentElement.clientWidth || 0;

  var unit;
  if (slot === 'leader') unit = w >= 760 ? UNITS.leader : UNITS.mobile;
  else if (slot === 'banner') unit = w >= 760 ? UNITS.banner : UNITS.mobile;
  else if (slot === 'rect') unit = UNITS.rect;
  if (!unit) return;

  // Adsterra's own snippet shape: set the global, then load invoke.js, which
  // reads it. Written with the tag split so this file never contains a literal
  // </script> sequence.
  var opts = '{"key":"' + unit.key + '","format":"iframe","height":' + unit.h +
             ',"width":' + unit.w + ',"params":{}}';
  document.write('<scr' + 'ipt>atOptions=' + opts + ';</scr' + 'ipt>');
  document.write('<scr' + 'ipt src="' + HOST + unit.key + '/invoke.js"></scr' + 'ipt>');

  // invoke.js creates its iframe with no title attribute. Lighthouse's
  // `frame-title` audit scores that 0 with weight 7, which cost the landing
  // page its whole accessibility budget (100 -> 95). Screen readers are the
  // real reason this matters: an untitled iframe announces as just "frame".
  // We cannot edit their script, so we title the frame as soon as it appears.
  var host = me.parentNode;
  function titleFrames() {
    if (!host || !host.querySelectorAll) return;
    var frames = host.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      if (!frames[i].getAttribute('title')) {
        frames[i].setAttribute('title', 'Advertisement');
      }
    }
  }
  titleFrames();
  if (host && window.MutationObserver) {
    // childList only — watching attributes too would re-fire on our own write.
    new MutationObserver(titleFrames).observe(host, { childList: true, subtree: true });
  }
  setTimeout(titleFrames, 1500);
  setTimeout(titleFrames, 4500);
})();
