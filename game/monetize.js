/* =============================================================
   NEON DROP — Monetization Adapter  v1.0
   -------------------------------------------------------------
   ONE game build, MANY ad networks. The game only ever calls:
        Ads.init()
        Ads.interstitial()            -> Promise<void>
        Ads.rewarded()                -> Promise<boolean> (true = reward)
        Ads.banner('slot-id')
   This file figures out WHICH network is available and routes to it.
   If no network is present it falls back to a safe local stub so the
   game is ALWAYS 100% playable (portals reject games that break
   when their SDK is absent).
   -------------------------------------------------------------
   HOW TO SWITCH NETWORK: edit AD_CONFIG below (or leave 'auto').
   ============================================================= */
(function (global) {
  'use strict';

  var AD_CONFIG = {
    // 'auto' | 'gamedistribution' | 'crazygames' | 'poki' | 'playgama' | 'adsense' | 'none'
    network: 'auto',

    // --- GameDistribution (https://gamedistribution.com) -------------
    gdGameId: '',          // e.g. '1a2b3c4d5e6f7g8h9i0j'  <-- paste yours

    // --- Google AdSense (self-hosted page ads) -----------------------
    adsenseClient: '',     // e.g. 'ca-pub-XXXXXXXXXXXXXXXX' (16 digits, from AdSense)

    // Minimum seconds between interstitials (portal policy friendly)
    interstitialCooldown: 90,

    debug: false
  };

  var _lastInterstitial = 0;
  var _detected = 'none';
  var _ready = false;

  function log() {
    if (AD_CONFIG.debug) console.log.apply(console, ['[Ads]'].concat([].slice.call(arguments)));
  }

  function detect() {
    if (AD_CONFIG.network !== 'auto') return AD_CONFIG.network;
    if (global.CrazyGames && global.CrazyGames.SDK) return 'crazygames';
    if (global.PokiSDK) return 'poki';
    if (global.playgamaBridge) return 'playgama';
    if (global.gdsdk || AD_CONFIG.gdGameId) return 'gamedistribution';
    if (AD_CONFIG.adsenseClient) return 'adsense';
    return 'none';
  }

  /* ---------------- GameDistribution bootstrap ------------------- */
  function loadGD() {
    return new Promise(function (resolve) {
      if (!AD_CONFIG.gdGameId) return resolve(false);
      global.GD_OPTIONS = {
        gameId: AD_CONFIG.gdGameId,
        onEvent: function (e) {
          if (e.name === 'SDK_GAME_PAUSE') global.dispatchEvent(new Event('ads:pause'));
          if (e.name === 'SDK_GAME_START') global.dispatchEvent(new Event('ads:resume'));
          if (e.name === 'SDK_READY') resolve(true);
        }
      };
      var s = document.createElement('script');
      s.src = 'https://html5.api.gamedistribution.com/main.min.js';
      s.async = true;
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
      setTimeout(function () { resolve(!!global.gdsdk); }, 6000);
    });
  }

  /* ---------------- Public API ----------------------------------- */
  var Ads = {
    get network() { return _detected; },
    get ready() { return _ready; },

    init: function () {
      _detected = detect();
      log('network =', _detected);
      var p;
      switch (_detected) {
        case 'gamedistribution': p = loadGD(); break;
        case 'crazygames':       p = global.CrazyGames.SDK.init().then(function(){return true;}); break;
        case 'poki':             p = global.PokiSDK.init().then(function(){return true;}, function(){return false;}); break;
        case 'playgama':         p = global.playgamaBridge.initialize().then(function(){return true;}); break;
        default:                 p = Promise.resolve(true);
      }
      return p.then(function (ok) {
        _ready = true;
        log('ready', ok);
        return ok;
      }).catch(function () { _ready = true; return false; });
    },

    /** Non-rewarded break ad. Never blocks gameplay on failure. */
    interstitial: function () {
      var now = Date.now() / 1000;
      if (now - _lastInterstitial < AD_CONFIG.interstitialCooldown) return Promise.resolve();
      _lastInterstitial = now;
      global.dispatchEvent(new Event('ads:pause'));
      var done = function () { global.dispatchEvent(new Event('ads:resume')); };
      try {
        switch (_detected) {
          case 'gamedistribution':
            if (global.gdsdk) return global.gdsdk.showAd().then(done, done);
            break;
          case 'crazygames':
            return new Promise(function (res) {
              global.CrazyGames.SDK.ad.requestAd('midgame', {
                adFinished: function () { done(); res(); },
                adError:    function () { done(); res(); }
              });
            });
          case 'poki':
            return global.PokiSDK.commercialBreak().then(done, done);
          case 'playgama':
            return global.playgamaBridge.advertisement.showInterstitial().then(done, done);
        }
      } catch (e) { log('interstitial error', e); }
      done();
      return Promise.resolve();
    },

    /** Rewarded video. Resolves TRUE only if the reward is earned. */
    rewarded: function () {
      global.dispatchEvent(new Event('ads:pause'));
      var resume = function (v) { global.dispatchEvent(new Event('ads:resume')); return v; };
      try {
        switch (_detected) {
          case 'gamedistribution':
            if (global.gdsdk) return global.gdsdk.preloadAd('rewarded')
              .then(function () { return global.gdsdk.showAd('rewarded'); })
              .then(function () { return resume(true); }, function () { return resume(false); });
            break;
          case 'crazygames':
            return new Promise(function (res) {
              global.CrazyGames.SDK.ad.requestAd('rewarded', {
                adFinished: function () { res(resume(true)); },
                adError:    function () { res(resume(false)); }
              });
            });
          case 'poki':
            return global.PokiSDK.rewardedBreak().then(function (ok) { return resume(!!ok); },
                                                       function () { return resume(false); });
          case 'playgama':
            return global.playgamaBridge.advertisement.showRewarded()
              .then(function () { return resume(true); }, function () { return resume(false); });
        }
      } catch (e) { log('rewarded error', e); }
      // No network available -> grant the reward so the game stays fun & testable.
      return Promise.resolve(resume(true));
    },

    /** Display banner (self-hosted AdSense pages only). */
    banner: function (slotId) {
      if (_detected !== 'adsense' || !AD_CONFIG.adsenseClient) return;
      var el = document.getElementById(slotId);
      if (!el || el.dataset.filled) return;
      el.dataset.filled = '1';
      el.innerHTML = '';
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', AD_CONFIG.adsenseClient);
      ins.setAttribute('data-ad-slot', el.dataset.adSlot || '');
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      el.appendChild(ins);
      try { (global.adsbygoogle = global.adsbygoogle || []).push({}); } catch (e) {}
    },

    /* Portal lifecycle signals — improves revenue & is required by Poki */
    gameplayStart: function () {
      try {
        if (_detected === 'poki') global.PokiSDK.gameplayStart();
        if (_detected === 'crazygames') global.CrazyGames.SDK.game.gameplayStart();
        if (_detected === 'playgama') global.playgamaBridge.game.setState('playing');
      } catch (e) {}
    },
    gameplayStop: function () {
      try {
        if (_detected === 'poki') global.PokiSDK.gameplayStop();
        if (_detected === 'crazygames') global.CrazyGames.SDK.game.gameplayStop();
        if (_detected === 'playgama') global.playgamaBridge.game.setState('paused');
      } catch (e) {}
    },
    loadingFinished: function () {
      try { if (_detected === 'poki') global.PokiSDK.gameLoadingFinished(); } catch (e) {}
    },

    config: AD_CONFIG
  };

  global.Ads = Ads;
})(window);
