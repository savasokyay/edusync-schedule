// WP-24: the verdict of entry-link-v2 (contracts/entry-link-v2.md sections 6-7 and 13) and the room catalog loader
// (contracts/room-catalog-v1.md). It replaces data.js: there is no reference data per term or exam any more.
//
//   resolve(fragment, {fetchJson, today, dataBase})   async: parse -> F1; load data/rooms.json (never fatal); evaluate
//   evaluate(parsed, catalog, today)                  pure: kind, room, seat, plan level and source, codes, notes
//   validateCatalog(json)                             problems that make a catalog unusable (G3); fixed tags only
//   layoutParamsFor(verdict)                          adapter: verdict -> room-geometry.layoutRoom() parameters
//
// The verdict has the shape of tests/vectors/link-v2.json (status, codes, notes, ignored, kind, room, seat,
// overflow_index, plan, course, student) plus `reason` (fatal only) and `details` (what the renderers need;
// not part of the contract). The `plan` object holds exactly the contract's fields; the desk width of the catalog
// (`each`) travels in `details`. A seat of the short form `room;desk` (WP-26, K-29) gets its row and column from the
// first grid that agrees (section 6.6), or I4 and a seat with null coordinates when none does.
//
// Loaded as a classic <script> after link.js (browser: window.SGB.verdict) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module !== null && module.exports;
  var link = isNode ? require('./link.js') : (root.SGB && root.SGB.link);
  // Fail at load time, not at the first resolve(): the script order is link.js, then verdict.js.
  if (!link || typeof link.parseFragment !== 'function') {
    throw new TypeError('verdict.js needs link.js to be loaded first');
  }
  var api = factory(link);
  if (isNode) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.verdict = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (link) {
  'use strict';

  var SEVERITY = { fatal: 3, warning: 2, info: 1, ok: 0 };
  var CODE_STATUS = { F1: 'fatal', S1: 'warning', I1: 'info', I2: 'info', I3: 'info', I4: 'info' };
  var MAX_ROWS_TO_SEAT = 40;   // rows-to-seat needs y <= 40 and q <= 20 (section 6.3)
  var MAX_COLS_TO_SEAT = 20;
  var MAX_FRONT_ROW = 20;      // front-row needs x <= 20

  var ROOM_ID = /^[0-9A-Za-z][0-9A-Za-z-]{0,31}$/;
  var SUFFIXED = /^(.+)-(o|y|[2-9])$/;
  var GENERATED_AT = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?([+-][0-9]{2}:[0-9]{2}|Z)$/;

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function isObj(x) {
    return x !== null && typeof x === 'object' && !Array.isArray(x);
  }
  function isInt(n, min, max) {
    return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
  }

  /** The viewer's local calendar date as YYYY-MM-DD (check I2 compares against it). */
  function todayString(d) {
    var t = d || new Date();
    function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
    return pad(t.getFullYear(), 4) + '-' + pad(t.getMonth() + 1, 2) + '-' + pad(t.getDate(), 2);
  }

  // --- the room catalog (room-catalog-v1) --------------------------------------------------------

  /**
   * Check a parsed `data/rooms.json` against what the page relies on: the header, and a non-empty `rooms` object
   * keyed by room id whose entries carry integer `cols` (1-20), `rows` (1-40) and `each` (1-6). Fields the page
   * does not know are ignored (additive change policy, room-catalog-v1 section 5).
   *
   * @returns {string[]} problems; empty when the catalog is usable. Strings are fixed tags, no data values.
   */
  function validateCatalog(json) {
    var problems = [];
    if (!isObj(json)) return ['catalog: not an object'];
    if (json.schema !== 'sgb-room-catalog') problems.push('catalog: schema');
    if (json.version !== 1) problems.push('catalog: version');
    if (typeof json.generated_at !== 'string' || !GENERATED_AT.test(json.generated_at)) problems.push('catalog: generated_at');
    if (has(json, 'source') && (typeof json.source !== 'string' || json.source.length > 300)) problems.push('catalog: source');
    if (!isObj(json.rooms) || Object.keys(json.rooms).length === 0) {
      problems.push('catalog: rooms');
      return problems;
    }
    Object.keys(json.rooms).forEach(function (id) {
      var r = json.rooms[id];
      if (!ROOM_ID.test(id)) problems.push('catalog: room id');
      if (!isObj(r) || !isInt(r.cols, 1, 20) || !isInt(r.rows, 1, 40) || !isInt(r.each, 1, 6)) problems.push('catalog: grid of a room');
    });
    return problems;
  }

  /**
   * Section 6.1: find the catalog entry of a room token. Rule 1: the token is a key. Rule 2: the token is
   * `<base>-<o|y|2..9>` and the base is a key. Never cut at the first hyphen: ids may contain one (D-101).
   *
   * @param {string} token  the room part of the seat string
   * @param {?Object} rooms  the `rooms` object of a validated catalog, or null
   * @returns {?{key: string, cols: number, rows: number, each: number}} the entry with its key, or null
   */
  function findRoom(token, rooms) {
    if (!rooms) return null;
    var key = null;
    if (has(rooms, token)) {
      key = token;
    } else {
      var m = SUFFIXED.exec(token);
      if (m && has(rooms, m[1])) key = m[1];
    }
    if (key === null) return null;
    var e = rooms[key];
    return { key: key, cols: e.cols, rows: e.rows, each: e.each };
  }

  // --- the verdict -------------------------------------------------------------------------------

  function emptyCourse() {
    return { code: null, section: null, name: null, exam: null, date: null, time: null };
  }

  function fatal(reason) {
    return {
      status: 'fatal', codes: ['F1'], notes: [], ignored: [], reason: reason, kind: null, room: null, seat: null,
      overflow_index: null, plan: null, course: emptyCourse(), student: { no: null, name: null },
      details: null
    };
  }

  function statusOf(codes) {
    var worst = 'ok';
    codes.forEach(function (c) {
      if (SEVERITY[CODE_STATUS[c]] > SEVERITY[worst]) worst = CODE_STATUS[c];
    });
    return worst;
  }

  /** The kinds of seat string that can use the room catalog (contract section 10); no other kind requests it. */
  function usesCatalogKind(kind) {
    return kind === 'normal' || kind === 'short' || kind === 'overflow' || kind === 'venue';
  }

  function addNote(notes, code) {
    if (notes.indexOf(code) === -1) notes.push(code);
  }

  /** Section 6.3: does a grid candidate agree with the seat string? */
  function agrees(candidate, seat) {
    return seat.x <= candidate.cols && seat.y <= candidate.rows &&
      seat.desk === (seat.y - 1) * candidate.cols + seat.x &&
      (candidate.source !== 'catalog' || seat.side === null || candidate.each >= 2);
  }

  /** Section 6.6: does a grid candidate agree with a short seat (a desk and no row and column)? */
  function agreesShort(candidate, seat) {
    return seat.desk <= candidate.cols * candidate.rows &&
      (candidate.source !== 'catalog' || seat.side === null || candidate.each >= 2);
  }

  /** Sections 6.3 and 6.6: the grid candidates in order: `g` of the link, then the catalog entry. */
  function gridCandidates(params, entry) {
    var candidates = [];
    if (params.g !== null) candidates.push({ source: 'link', cols: params.g.cols, rows: params.g.rows, each: null });
    if (entry !== null) candidates.push({ source: 'catalog', cols: entry.cols, rows: entry.rows, each: entry.each });
    return candidates;
  }

  /**
   * Section 6.4: may the pattern `p` draw the seats? The number of columns must be known, `p` as long as the
   * columns, `p[x - 1]` 2 exactly when the seat string carries a side letter, and for a catalog grid no value
   * above its `each`.
   */
  function patternUsable(p, plan, seat, each) {
    if (plan.cols === null || p.length !== plan.cols) return false;
    if ((p[seat.x - 1] === 2) !== (seat.side !== null)) return false;
    if (plan.source === 'catalog' && !p.every(function (v) { return v <= each; })) return false;
    return true;
  }

  /** The plan of a kind `normal` seat (sections 6.2-6.4); fills codes and notes. */
  function planNormal(params, seat, entry, codes, notes, details) {
    var x = seat.x;
    var y = seat.y;
    var marker = seat.side === 'a' ? 'left' : (seat.side === 'b' ? 'right' : 'center');
    var plan = { level: 'desk-only', source: 'seat', cols: null, rows: null, marker: marker, uncertain: false, pattern: null };

    // 6.2: seat consistency. For y >= 2, q is the number of columns the string implies.
    var q = null;
    var consistent;
    if (y === 1) {
      consistent = seat.desk === x;
    } else {
      var diff = seat.desk - x;
      consistent = diff % (y - 1) === 0 && diff / (y - 1) >= x;
      q = diff / (y - 1);
    }
    if (!consistent) {
      codes.push('S1');
      plan.uncertain = true;
      if (params.p !== null) addNote(notes, 'G2');   // desk-only: the columns are unknown, p cannot be used
      return plan;
    }

    // 6.3: the candidates, in order: g of the link, then the catalog entry; the first that agrees is used.
    var candidates = gridCandidates(params, entry);
    var chosen = null;
    for (var i = 0; i < candidates.length && chosen === null; i++) {
      if (agrees(candidates[i], seat)) chosen = candidates[i];
      else addNote(notes, 'G1');
    }
    if (chosen !== null) {
      plan.level = 'full';
      plan.source = chosen.source;
      plan.cols = chosen.cols;
      plan.rows = chosen.rows;
      // The desk width is the catalog's `each` only when the catalog entry is the source (K-13, section 6.3):
      // a candidate from the link carries each = null.
      details.each = chosen.each;
    } else if (y >= 2 && q <= MAX_COLS_TO_SEAT && y <= MAX_ROWS_TO_SEAT) {
      plan.level = 'rows-to-seat';
      plan.cols = q;
      plan.rows = y;
    } else if (y === 1 && x <= MAX_FRONT_ROW) {
      plan.level = 'front-row';
      plan.rows = 1;
    }

    usePattern(params, plan, seat, details, notes);
    return plan;
  }

  /** Section 6.4: take the pattern `p` into the plan when it may be used, else note G2 (nothing when there is no `p`). */
  function usePattern(params, plan, seat, details, notes) {
    if (params.p === null) return;
    // `each` matters only when the catalog is the source, and then details.each is the entry's own.
    if (patternUsable(params.p, plan, seat, details.each)) plan.pattern = params.p.slice();
    else addNote(notes, 'G2');
  }

  /**
   * The seat and the plan of a kind `short` seat (section 6.6): the row and column come from the first grid candidate
   * that agrees (`g`, then the catalog), by the row-major convention of section 5.1. Without such a grid they are
   * unknown: code I4, seat coordinates null, no plan, and a `p` that is present is G2.
   *
   * @returns {Object} `seat` (the seat object of the verdict) and `plan` (the plan object, or null for I4)
   */
  function planShort(params, seat, entry, codes, notes, details) {
    var candidates = gridCandidates(params, entry);
    var chosen = null;
    for (var i = 0; i < candidates.length && chosen === null; i++) {
      if (agreesShort(candidates[i], seat)) chosen = candidates[i];
      else addNote(notes, 'G1');
    }
    if (chosen === null) {
      codes.push('I4');
      if (params.p !== null) addNote(notes, 'G2');
      return { seat: { x: null, y: null, desk: seat.desk, side: seat.side }, plan: null };
    }
    // desk = (y - 1) * cols + x, so the row is the number of full rows before the desk, plus one
    var y = Math.floor((seat.desk - 1) / chosen.cols) + 1;
    var derived = { x: seat.desk - (y - 1) * chosen.cols, y: y, desk: seat.desk, side: seat.side };
    var plan = {
      level: 'full', source: chosen.source, cols: chosen.cols, rows: chosen.rows,
      marker: seat.side === 'a' ? 'left' : (seat.side === 'b' ? 'right' : 'center'), uncertain: false, pattern: null
    };
    details.each = chosen.each;
    usePattern(params, plan, derived, details, notes);
    return { seat: derived, plan: plan };
  }

  /**
   * The verdict for a parsed link (section 7 and 13).
   *
   * @param {Object} parsed  result of link.parseFragment() with ok === true
   * @param {?Object} catalog  the `rooms` object of a validated catalog, or null when it is unavailable (note G3)
   * @param {string} [today]  YYYY-MM-DD, the viewer's local date (default: now)
   */
  function evaluate(parsed, catalog, today) {
    var day = today || todayString();
    var seat = parsed.seat;
    var params = parsed.params;
    var codes = [];
    var notes = [];

    // The catalog is requested only for the kinds that can use it; its absence there is note G3.
    var usesCatalog = usesCatalogKind(seat.kind);
    if (catalog === null && usesCatalog) notes.push('G3');
    var entry = usesCatalog ? findRoom(seat.room, catalog) : null;

    // WP-24 (K-26): `inCatalog` is whether the room named by the seat string has an entry in the catalog. It is false
    // when the catalog is unavailable (G3), and for the kinds that never look the room up (unseated, unknown); the
    // page asks it, so that it never has to search the catalog itself.
    var details = { link: parsed, each: null, catalogAvailable: catalog !== null, inCatalog: entry !== null };
    var verdict = {
      status: 'ok', codes: codes, notes: notes, ignored: parsed.ignored.slice(), kind: seat.kind, room: null, seat: null,
      overflow_index: null, plan: null, course: emptyCourse(), student: { no: parsed.student.no, name: parsed.student.name },
      details: details
    };
    if (usesCatalog) verdict.room = entry !== null ? entry.key : seat.room;   // section 6.1: the key, else as given

    if (seat.kind === 'normal') {
      verdict.seat = { x: seat.x, y: seat.y, desk: seat.desk, side: seat.side };
      verdict.plan = planNormal(params, seat, entry, codes, notes, details);
    } else if (seat.kind === 'short') {
      var shortSeat = planShort(params, seat, entry, codes, notes, details);
      verdict.seat = shortSeat.seat;
      verdict.plan = shortSeat.plan;
    } else if (seat.kind === 'overflow') {
      // Section 6.5: the full grid of g, else of the catalog; no seat, no marker, no agreement test.
      verdict.overflow_index = seat.n;
      var grid = null;
      if (params.g !== null) grid = { source: 'link', cols: params.g.cols, rows: params.g.rows, each: null };
      else if (entry !== null) grid = { source: 'catalog', cols: entry.cols, rows: entry.rows, each: entry.each };
      if (grid !== null) {
        verdict.plan = { level: 'full', source: grid.source, cols: grid.cols, rows: grid.rows, marker: null, uncertain: false, pattern: null };
        details.each = grid.each;
      }
    } else if (seat.kind === 'unseated') {
      codes.push('I1');
    } else if (seat.kind === 'unknown') {
      codes.push('I3');
    }

    if (params.dt !== null) {
      verdict.course.date = params.dt.slice(0, 10);
      verdict.course.time = params.dt.slice(11);
      if (verdict.course.date < day) codes.push('I2');
    }
    verdict.course.code = params.c;
    verdict.course.section = params.sb;
    verdict.course.name = params.dn;
    verdict.course.exam = params.ex;

    codes.sort();
    notes.sort();
    verdict.status = statusOf(codes);
    return verdict;
  }

  /**
   * Adapter: verdict -> parameters for room-geometry.layoutRoom(), or null when no plan is drawn.
   * `each` is the catalog's desk width when the catalog is the source, else null (the geometry uses a default
   * that fits two seats). The student's seat is passed for kind `normal` only; `uncertain` mirrors the plan.
   */
  function layoutParamsFor(verdict) {
    var plan = verdict.plan;
    if (!plan) return null;
    var seat = verdict.seat;
    return {
      level: plan.level,
      cols: plan.cols,
      rows: plan.rows,
      each: verdict.details.each,
      pattern: plan.pattern === null ? null : plan.pattern.slice(),
      seat: seat === null ? null : { x: seat.x, y: seat.y, desk: seat.desk, side: seat.side },
      uncertain: plan.uncertain
    };
  }

  // --- loading -----------------------------------------------------------------------------------

  /** Default loader: same-origin JSON, always revalidated (section 10), no credentials, no referrer. */
  function defaultFetchJson(url) {
    return fetch(url, { cache: 'no-cache', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' })
      .then(function (response) {
        if (!response.ok) throw new Error('http');
        return response.json();
      });
  }

  /**
   * Parse the fragment, load the room catalog when the seat string can use it, and return the verdict.
   *
   * F1 on the link stops everything before any request. The catalog is never fatal: a load failure or a catalog
   * that does not conform is note G3, and the page goes on as if the room had no entry. A loader failure is
   * never an exception; the only URL ever requested is `<dataBase>rooms.json`.
   *
   * @param {string} fragment  location.hash (with or without '#')
   * @param {Object} [options]
   *     fetchJson: function(string): Promise<Object>, replaces fetch (tests); today: YYYY-MM-DD.
   *     dataBase: URL prefix of the data folder, relative to the page (default 'data/'); a code-level
   *     setting for the developer preview pages, never taken from the link.
   * @returns {Promise<Object>} verdict
   */
  function resolve(fragment, options) {
    var opts = options || {};
    var fetchJson = opts.fetchJson || defaultFetchJson;
    var base = typeof opts.dataBase === 'string' ? opts.dataBase : 'data/';
    var parsed = link.parseFragment(fragment);
    if (!parsed.ok) return Promise.resolve(fatal(parsed.reason));

    if (!usesCatalogKind(parsed.seat.kind)) {
      return Promise.resolve(evaluate(parsed, null, opts.today));
    }
    return Promise.resolve().then(function () { return fetchJson(base + 'rooms.json'); }).then(
      function (json) { return validateCatalog(json).length === 0 ? json.rooms : null; },
      function () { return null; }
    ).then(function (rooms) {
      return evaluate(parsed, rooms, opts.today);
    });
  }

  return {
    resolve: resolve,
    evaluate: evaluate,
    validateCatalog: validateCatalog,
    findRoom: findRoom,
    layoutParamsFor: layoutParamsFor,
    todayString: todayString,
    SEVERITY: SEVERITY
  };
});
