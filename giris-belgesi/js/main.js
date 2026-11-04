// WP-08 / WP-24: page entry point. Reads the URL fragment, resolves the verdict, builds the page tree and mounts it.
//
// Loaded last (after dom-tree, room-geometry, render-room, link, verdict, i18n, render-info, fit). Nothing here
// touches storage, the network (apart from verdict.resolve, which fetches this site's own data/rooms.json, the
// room catalog), or innerHTML; the document title is the same fixed string for every link (no personal data in
// tab titles, history entries or window lists).
(function () {
  'use strict';

  var SGB = window.SGB;
  var i18n = SGB.i18n.create('tr');
  var app = document.getElementById('app');

  // SITE SETTING (entry-link-v2 section 6.4): when a link carries a seating pattern (`p`) that the page can use, 'all'
  // draws the seats of every desk in the plan and 'own' only the student's desk. This is the one place to change it;
  // it is not a link parameter, so a link cannot change it. (Later it may come from the build configuration.)
  var PATTERN_SEATS = 'all';

  function buildStamp() {
    var meta = document.querySelector('meta[name="sgb-version"]');
    var value = meta ? meta.getAttribute('content') : '';
    return value ? value : undefined;
  }

  function show(page) {
    document.title = page.title;
    while (app.firstChild) app.removeChild(app.firstChild);
    SGB.domTree.mountTree(document, app, page.tree);
    // measure and fit the seat block's type to the big digits (fit.js); the CSS alone is already close
    if (SGB.fit) SGB.fit.install(app);
  }

  function message(titleKey, textKey) {
    show(SGB.renderInfo.buildMessagePage(i18n, titleKey, textKey, { version: buildStamp() }));
  }

  // entry-link-v2 section 10: <meta> CSP cannot carry frame-ancestors, so the page refuses to render in a
  // frame (clickjacking, or a page that embeds the link to watch it). The fragment is not even read.
  if (window.self !== window.top) {
    message(null, 'frame');
    return;
  }

  // K-30: the identity of the link (`no`, `ad`) is read, drawn, and then taken out of the address bar, so that it does not
  // stay in the browser's history or in a bookmark, a screenshot of the address or a copied URL. The page shows the
  // same place without it after a reload. Nothing else is touched: the rest of the fragment is the raw text of the
  // fragment, parts in the same order, never decoded or encoded again.
  var IDENTITY_PARAMS = ['no', 'ad'];

  /**
   * The raw fragment without its identity parameters, or null when it has none. A part is an identity parameter when its
   * name, decoded exactly as link.js decodes it (form-urlencoded, so `n%6F` is `no`), is `no` or `ad`; that holds
   * whether or not the link is valid and whatever the value is. Other parts, empty ones too, stay as they are.
   */
  function withoutIdentity(hash) {
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    var parts = raw.split('&');
    var kept = parts.filter(function (part) {
      var name = new URLSearchParams('?' + part.split('=')[0]).keys().next().value;
      return IDENTITY_PARAMS.indexOf(name) === -1;
    });
    return kept.length === parts.length ? null : kept.join('&');
  }

  // replaceState does not fire `hashchange`, so the page is not drawn a second time. It must never break the page: a
  // browser that refuses it just leaves the address as it is.
  function forgetIdentity() {
    try {
      var rest = withoutIdentity(window.location.hash);
      if (rest !== null) window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + rest);
    } catch (e) {
      // the address keeps the identity; the page itself is already drawn
    }
  }

  function run() {
    SGB.verdict.resolve(window.location.hash).then(function (verdict) {
      show(SGB.renderInfo.buildPage(verdict, i18n, { version: buildStamp(), patternSeats: PATTERN_SEATS }));
      forgetIdentity();
    }).catch(function () {
      message('unexpected.title', 'unexpected.text');
      forgetIdentity();
    });
  }

  window.addEventListener('hashchange', run);
  run();
}());
