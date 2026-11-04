// WP-24: entry-link-v2 fragment parser (contracts/entry-link-v2.md, sections 2-4 and 11). Pure: no DOM, no I/O.
//
// parseFragment(string) ->
//   { ok: true, params, seat, student, ignored } | { ok: false, code: 'F1', reason }
//
// A v=1 link is read by the very same rules (section 11): the page knows no other version. Only `v` and `k` are
// required. Every other recognized parameter is optional: an empty value is absent, and a value that does not
// match its pattern is IGNORED (treated as absent, never rendered, listed in `ignored`), never an error.
// F1 (malformed link) is for: an empty or too long fragment, a duplicate recognized parameter, a missing,
// empty or invalid `v`, a missing, empty or over-long `k`, and a `k` that matches no form of section 4.
// `reason` is a short machine tag built from fixed strings only, never from the input, so it is safe to log or
// show. Values reach the page only after the strict regular expressions below; the page then writes them with
// textContent.
//
// Loaded as a classic <script> (browser: window.SGB.link) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.link = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_FRAGMENT = 1024;   // before decoding (section 2)
  var MAX_K = 64;            // decoded (section 3)
  var MAX_COLS = 20;         // g: columns x rows, section 3
  var MAX_ROWS = 40;

  // WP-24: the recognized parameters; anything else is ignored and never rendered (section 2). `no` and `ad`
  // are the optional identity; there is no instructor parameter and, since K-25, no term (`tm`): a v=1 link that
  // still carries one is read like any link with an unrecognized parameter.
  var RECOGNIZED = ['v', 'k', 'c', 'sb', 'dn', 'ex', 'dt', 'g', 'p', 'no', 'ad'];

  // Anchored, evaluated on the decoded value (section 3).
  var PATTERN = {
    v: /^[12]$/,
    c: /^[0-9A-Z]{3,12}$/,
    sb: /^[0-9A-Z]{1,3}$/,
    dn: /^[\p{L}0-9][\p{L}0-9 .,:'()&\/+\-]{0,79}$/u,
    ex: /^(AS1|AS2|FNLS|BUTS)$/,
    // The year is 20xx (contract section 3): no exam is dated outside the 2000s, and Date.UTC reads the years
    // 0-99 as 1900-1999, which a four-digit pattern would let through.
    dt: /^(20[0-9]{2})-([0-9]{2})-([0-9]{2})T([01][0-9]|2[0-3]):([0-5][0-9])$/,
    g: /^([1-9][0-9]?)x([1-9][0-9]?)$/,
    p: /^[12](-[12]){0,19}$/,
    no: /^[0-9]{6,15}$/,
    ad: /^\p{L}[\p{L} .'\-]{0,59}$/u
  };

  // Seat string forms (section 4). Turkish letters are spelled as escapes: C-cedilla, G-breve,
  // dotted capital I, O-umlaut, S-cedilla, U-umlaut and their lowercase counterparts.
  var TR = '\\u00C7\\u011E\\u0130\\u00D6\\u015E\\u00DC\\u00E7\\u011F\\u0131\\u00F6\\u015F\\u00FC';
  var K_NORMAL = /^([0-9A-Za-z][0-9A-Za-z-]{0,31});([1-9][0-9]?);([1-9][0-9]?);([1-9][0-9]{0,2})(?:-([ab]))?$/;
  // WP-26 (K-29): the short form `room;desk[-side]`, a desk without row and column (section 4, 6.6). The room and the desk
  // are those of `normal`. Three fields (`386;1;5`) are still no known form: `unknown`.
  var K_SHORT = /^([0-9A-Za-z][0-9A-Za-z-]{0,31});([1-9][0-9]{0,2})(?:-([ab]))?$/;
  var K_OVERFLOW = /^([0-9A-Za-z][0-9A-Za-z-]{0,31});0;0;([1-9][0-9]{0,2})-t$/;
  var K_VENUE = new RegExp('^([0-9A-Za-z' + TR + '][0-9A-Za-z' + TR + ' ._-]{0,31});;;$');
  // WP-24: a form this version does not know: the venue character set plus ';', ':' and ',', 64 characters at most.
  var K_UNKNOWN = new RegExp('^[0-9A-Za-z' + TR + '][0-9A-Za-z' + TR + ' ;:.,_-]{0,63}$');
  // U+0130, spelled as an escape inside a string so the source stays pure ASCII (a test enforces it).
  var DOTTED_CAPITAL_I = new RegExp('\\u0130', 'g');

  function fail(reason) {
    return { ok: false, code: 'F1', reason: reason };
  }

  /**
   * No-seat marker test (section 4): NFC-normalize, trim, replace U+0130 (dotted capital I) with
   * plain I, lowercase; the marker is "giremez" (the scheduler's no-seat marker, compared case-insensitively).
   * The replacement must come before lowercasing: U+0130 lowercases to "i" plus a combining dot.
   */
  function isNoSeatMarker(value) {
    return value.normalize('NFC').trim().replace(DOTTED_CAPITAL_I, 'I').toLowerCase() === 'giremez';
  }

  /**
   * Classify the decoded `k` value in the order of section 4, or return null when it matches no form (F1).
   * The kinds, in the order they are tried: normal, short, overflow, venue, unseated, unknown.
   */
  function parseSeat(k) {
    var m = K_NORMAL.exec(k);
    if (m) {
      return { kind: 'normal', room: m[1], x: Number(m[2]), y: Number(m[3]), desk: Number(m[4]), side: m[5] || null };
    }
    m = K_SHORT.exec(k);
    if (m) return { kind: 'short', room: m[1], desk: Number(m[2]), side: m[3] || null };
    m = K_OVERFLOW.exec(k);
    if (m) return { kind: 'overflow', room: m[1], n: Number(m[2]) };
    m = K_VENUE.exec(k);
    if (m) return { kind: 'venue', room: m[1] };
    if (k === '-1' || isNoSeatMarker(k)) return { kind: 'unseated' };
    if (K_UNKNOWN.test(k)) return { kind: 'unknown' };
    return null;
  }

  /**
   * True for a date that exists in the calendar (the pattern alone lets 30 February through). A day that does not
   * exist rolls into the next (or previous) month, so comparing the month is enough: the year cannot change in a
   * way that matters (it is 2000-2099, which Date.UTC reads as written) and the day need not be compared.
   */
  function isRealDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day)).getUTCMonth() === month - 1;
  }

  /**
   * Parse the URL fragment (with or without the leading '#').
   *
   * @param {string} input  location.hash or the fragment text
   * @returns {Object} see the file header. params: v ('1' or '2'), k, c, sb, dn, ex, dt (each a string, or
   *     null when absent or ignored), g ({cols, rows} or null) and p (array of 1 and 2, or null)
   */
  function parseFragment(input) {
    if (typeof input !== 'string') return fail('not-a-string');
    var fragment = input.charAt(0) === '#' ? input.slice(1) : input;
    if (fragment === '') return fail('empty');
    if (fragment.length > MAX_FRAGMENT) return fail('too-long');

    // application/x-www-form-urlencoded rules (same as URLSearchParams): '&' separates, '+' is a
    // space, percent-decoding is UTF-8. The leading '?' is deliberate: URLSearchParams drops one
    // leading '?' of its input, which would otherwise let "#?v=2&..." through as a valid link.
    var search = new URLSearchParams('?' + fragment);
    var raw = {};
    for (var i = 0; i < RECOGNIZED.length; i++) {
      var name = RECOGNIZED[i];
      var all = search.getAll(name);
      if (all.length > 1) return fail('duplicate:' + name);
      if (all.length === 1) raw[name] = all[0];
    }

    // The two required parameters: absent or empty is F1.
    if (raw.v === undefined || raw.v === '') return fail('missing:v');
    if (!PATTERN.v.test(raw.v)) return fail('invalid:v');
    if (raw.k === undefined || raw.k === '') return fail('missing:k');
    if (raw.k.length > MAX_K) return fail('invalid:k');
    var seat = parseSeat(raw.k);
    if (seat === null) return fail('invalid:k');

    // Optional parameters. take() returns the accepted value, or null when the parameter is absent (no
    // value, or empty; for dn and ad empty after NFC and trim) or unusable (then its name is listed).
    var ignored = [];
    function take(param, normalize, accept) {
      var value = raw[param];
      if (value === undefined) return null;
      if (normalize) value = value.normalize('NFC').trim();
      if (value === '') return null;
      var out = accept(value);
      if (out === null) ignored.push(param);
      return out;
    }
    function matching(param) {
      return function (value) { return PATTERN[param].test(value) ? value : null; };
    }

    var c = take('c', false, matching('c'));
    var sb = take('sb', false, matching('sb'));
    var dn = take('dn', true, matching('dn'));
    var ex = take('ex', false, matching('ex'));
    var dt = take('dt', false, function (value) {
      var m = PATTERN.dt.exec(value);
      return m && isRealDate(Number(m[1]), Number(m[2]), Number(m[3])) ? value : null;
    });
    var g = take('g', false, function (value) {
      var m = PATTERN.g.exec(value);
      if (!m) return null;
      var cols = Number(m[1]);
      var rows = Number(m[2]);
      return cols <= MAX_COLS && rows <= MAX_ROWS ? { cols: cols, rows: rows } : null;
    });
    var p = take('p', false, function (value) {
      return PATTERN.p.test(value) ? value.split('-').map(Number) : null;
    });
    var no = take('no', false, matching('no'));
    var name2 = take('ad', true, matching('ad'));

    ignored.sort();
    return {
      ok: true,
      params: { v: raw.v, k: raw.k, c: c, sb: sb, dn: dn, ex: ex, dt: dt, g: g, p: p },
      seat: seat,
      student: { no: no, name: name2 },
      ignored: ignored
    };
  }

  return {
    parseFragment: parseFragment,
    parseSeat: parseSeat,
    isNoSeatMarker: isNoSeatMarker,
    MAX_FRAGMENT: MAX_FRAGMENT,
    RECOGNIZED: RECOGNIZED.slice()
  };
});
