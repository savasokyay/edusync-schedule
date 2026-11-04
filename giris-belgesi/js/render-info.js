// WP-06 / WP-24: the page as a plain tree: masthead, status bands, block A (exam and seat information),
// block B (floor plan slot) and the footer. Pure: a verdict (verdict.js) plus a translator (i18n.js) in,
// a {tag, attrs, children, text} tree out; dom-tree.js mounts it. No text lives here: every visible
// string comes from the dictionary, and every value reaches the page as text (never as markup).
//
// Nothing in block A depends on reference data (entry-link-v2 section 8): the exam line of the masthead, the
// course, date and time rows each appear only when the link carried their data, and the term is never shown.
//
// Colour roles (also used by the floor plan): room red, column (x) green, row (y) blue; they live in the big
// seat row and in the plan's axis labels (there is no separate colour-coded seat string any more).
//
// Loaded as a classic <script> (browser: window.SGB.renderInfo) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module !== null && module.exports;
  var deps = {
    verdict: isNode ? require('./verdict.js') : (root.SGB && root.SGB.verdict),
    geometry: isNode ? require('./room-geometry.js') : (root.SGB && root.SGB.roomGeometry),
    room: isNode ? require('./render-room.js') : (root.SGB && root.SGB.renderRoom),
    tree: isNode ? require('./dom-tree.js') : (root.SGB && root.SGB.domTree)
  };
  // Fail at load time: dom-tree, room-geometry, render-room, link, verdict, then this file.
  if (!deps.verdict || !deps.geometry || !deps.room || !deps.tree) {
    throw new TypeError('render-info.js needs verdict.js, room-geometry.js, render-room.js and dom-tree.js to be loaded first');
  }
  var api = factory(deps);
  if (isNode) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.renderInfo = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  var PLAN_DISPLAY_WIDTH = 400;   // CSS pixels the plan aims for (render-room.displayScale)
  var STATUS_ORDER = { fatal: 0, warning: 1, info: 2 };
  var KIND_OF = { F: 'fatal', S: 'warning', I: 'info' };

  // WP-24: the site setting of contract section 6.4 (not a link parameter): when a seating pattern `p` is used, 'all'
  // draws the seats of every desk, 'own' only the student's. The SITE's value is the constant PATTERN_SEATS in
  // main.js, handed in through buildPage's `patternSeats` option; this is only what a caller that passes none gets.
  var DEFAULT_PATTERN_SEATS = 'all';

  /** t(path, values) with t.list(path) attached, as a fresh function: the caller's translator is not touched. */
  function translatorFn(translator) {
    var t = function (path, values) { return translator.t(path, values); };
    t.list = function (path) { return translator.list(path); };
    return t;
  }

  function node(tag, cls, text, children, attrs) {
    var n = { tag: tag, attrs: Object.assign({}, attrs || {}) };
    if (cls) n.attrs['class'] = cls;
    if (text !== undefined && text !== null) n.text = String(text);
    var kids = (children || []).filter(Boolean);
    if (kids.length > 0) n.children = kids;
    return n;
  }

  /** "2026-11-10" -> "10 <month name> 2026, <weekday name>" (names from the dictionary; no Intl, no time zone). */
  function formatDate(iso, months, weekdays) {
    var p = iso.split('-');
    var y = Number(p[0]);
    var m = Number(p[1]);
    var d = Number(p[2]);
    var weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
    return d + ' ' + months[m - 1] + ' ' + y + ', ' + weekdays[weekday];
  }

  /** Codes in display order: most severe first, then ascending. */
  function orderedCodes(codes) {
    return codes.slice().sort(function (a, b) {
      var d = STATUS_ORDER[KIND_OF[a.charAt(0)]] - STATUS_ORDER[KIND_OF[b.charAt(0)]];
      return d !== 0 ? d : (a < b ? -1 : a > b ? 1 : 0);
    });
  }

  function band(t, code) {
    var kind = KIND_OF[code.charAt(0)];
    return node('div', 'band band-' + kind, null, [
      node('p', 'band-title', t('band.' + code + '.title')),
      node('p', 'band-text', t('band.' + code + '.text'))
    ], { role: kind === 'info' || kind === 'warning' ? 'status' : 'alert', 'data-code': code });
  }

  /** The masthead: the fixed title, and under it the exam type when the link carried one (never the term). */
  function masthead(verdict, t) {
    var exam = verdict.course.exam;
    return node('header', 'masthead', null, [
      node('h1', 'masthead-title', t('page.title')),
      exam !== null ? node('p', 'masthead-exam', t('exam.' + exam)) : null
    ]);
  }

  function who(verdict, t) {
    var s = verdict.student;
    if (!s || (s.name === null && s.no === null)) return null;
    return node('p', 'who', null, [
      s.name !== null ? node('strong', 'who-name', s.name) : null,
      s.no !== null ? node('span', 'who-no', t('value.studentNo', { no: s.no })) : null
    ]);
  }

  /** One labelled value of the big seat row: a small label over the value. */
  function item(cls, label, value, valueCls) {
    return node('p', 'hero-item ' + cls, null, [
      node('span', 'hero-label', label),
      node('span', 'hero-value' + (valueCls ? ' ' + valueCls : ''), value)
    ]);
  }

  /** Room | desk | seat block of a seat whose column and row are known (kind normal, or short with a known grid). */
  function seatHero(room, roomCls, seat, t) {
    var column = item('hero-col', t('label.column'), seat.x, 'ink-x');
    var row = item('hero-row', t('label.row'), seat.y, 'ink-y');
    // K-21: the form follows the seat string; a missing letter shows no seat line at all
    var seatBlock = seat.side !== null
      ? node('div', 'hero-seat', null, [
        node('div', 'hero-axes', null, [column, row]),
        item('hero-side', t('label.side'), t('side.' + seat.side))
      ])
      : node('div', 'hero-seat hero-seat-stacked', null, [column, row]);
    return node('div', 'hero', null, [
      item(roomCls, t('label.room'), room, 'ink-room'),
      item('hero-desk', t('label.desk'), seat.desk),
      seatBlock
    ]);
  }

  /**
   * Room | desk of a short seat whose grid is not known (I4): the values as they came, with no column and no row. When
   * the string carries a side letter, the third block is the seat alone.
   *
   * That block (`hero-lone`) sets its text smaller than the desk number, like a long room id, so that the three blocks
   * stay on one line at every width (320 px). The text sits inside a value box of the desk number's own size, in an
   * inner span (`hero-lone-text`): the box's line then has the desk number's height and baseline in any font, so the
   * label stays level with the others and the seat stands on the digits' baseline (K-20), with no measuring script.
   */
  function loneItem(label, value) {
    return node('p', 'hero-item hero-side hero-lone', null, [
      node('span', 'hero-label', label),
      node('span', 'hero-value', null, [node('span', 'hero-lone-text', value)])
    ]);
  }

  function unplacedHero(room, roomCls, seat, t) {
    return node('div', 'hero', null, [
      item(roomCls, t('label.room'), room, 'ink-room'),
      item('hero-desk', t('label.desk'), seat.desk),
      seat.side !== null ? loneItem(t('label.side'), t('side.' + seat.side)) : null
    ]);
  }

  /**
   * The big seat block (K-18 round 4, K-21): three blocks on ONE line at every width, room | desk | seat block.
   * Room and desk are a small label over a very large value (the room in red). The seat block has one of two
   * forms, chosen by the seat string alone (never by the room's column pattern):
   *   - the string carries a seat letter (-a / -b): on top column | row (column left in green, row right in blue,
   *     each a label over a value) and under them the seat, "Sol (a)" or "Sag (b)" (words from the dictionary);
   *   - no letter (a normal place, one student at the desk): no seat line and no word for the middle; column over
   *     row, the column (green) on top and the row (blue) under it, each a label over a value.
   * Both forms have two label lines and two value lines, so the CSS sizes their values by the same rule so that
   * the block's height equals that of the room and desk blocks, and scales everything with the container width so
   * nothing wraps. A long room id (more than three characters, e.g. "D-101") is set smaller.
   * The other kinds (section 8): short is the same as normal when its grid is known and room | desk | seat (no column
   * and row) when it is not (I4); overflow shows the room and the extra seat; venue the venue name; unknown the raw
   * seat string as text; unseated no block at all.
   */
  function hero(verdict, t) {
    var room = verdict.room;
    var roomCls = 'hero-room' + (room !== null && String(room).length > 3 ? ' hero-long' : '');
    var seat = verdict.seat;
    switch (verdict.kind) {
      case 'normal':
        return seatHero(room, roomCls, seat, t);
      case 'short':
        // WP-26 (K-29): a short seat string whose grid is known has the row and column derived from it, and the block is
        // exactly that of kind normal. When no grid is known (I4) there is no column and no row to show.
        return seat.x !== null ? seatHero(room, roomCls, seat, t) : unplacedHero(room, roomCls, seat, t);
      case 'overflow':
        return node('div', 'hero hero-plain', null, [
          item(roomCls, t('label.room'), room, 'ink-room'),
          node('p', 'hero-extra', t('value.overflow', { n: verdict.overflow_index })),
          node('p', 'hero-note', t('value.overflowNote'))
        ]);
      case 'venue':
        // WP-24 (K-26): "this venue has no desk plan" is said only of a venue that is not a room of the catalog; a room
        // the catalog knows is a classroom, and a missing plan there needs no explanation. The verdict says which it is.
        return node('div', 'hero hero-plain', null, [
          item(roomCls, t('label.room'), room, 'ink-room'),
          verdict.details.inCatalog ? null : node('p', 'hero-note', t('value.venueNote'))
        ]);
      case 'unknown':
        // The seat string as it came, shown as text under a label of the size of the other labels, and nothing else:
        // no plan can be drawn from a form this page does not know (the I3 band says so).
        return node('div', 'hero hero-plain', null, [
          node('p', 'hero-unknown', null, [
            node('span', 'hero-label', t('label.unknownSeat')),
            node('span', 'hero-raw', verdict.details.link.params.k)
          ])
        ]);
      default:
        return null; // unseated: no seat to show
    }
  }

  function fact(label, children) {
    return node('div', 'fact', null, [node('dt', null, label), node('dd', null, null, children)]);
  }

  /**
   * The course row (section 8): the course name as the main text, with the code and the section as the subtext; without
   * a name the code and section line is the main text. No row when the link carried none of them.
   */
  function courseFact(course, t) {
    var section = course.section !== null ? t('value.section', { section: course.section }) : null;
    var codeLine = course.code !== null ? (section !== null ? course.code + ', ' + section : course.code) : section;
    if (course.name !== null) {
      return fact(t('label.course'), [
        node('span', 'fact-main', course.name),
        codeLine !== null ? node('span', 'fact-sub', codeLine) : null
      ]);
    }
    return codeLine !== null ? fact(t('label.course'), [node('span', 'fact-main', codeLine)]) : null;
  }

  /**
   * The facts: course, date and time, each only when the link carried it; null when there is none (no empty list).
   * Only the start time is shown: the end is not known to the student's record, and a duration would give it away.
   */
  function facts(verdict, t) {
    var course = verdict.course;
    var rows = [
      courseFact(course, t),
      course.date !== null ? fact(t('label.date'), [node('span', 'fact-main', formatDate(course.date, t.list('months'), t.list('weekdays')))]) : null,
      course.time !== null ? fact(t('label.time'), [node('span', 'fact-main', course.time)]) : null
    ].filter(Boolean);
    return rows.length > 0 ? node('dl', 'facts', null, rows) : null;
  }

  function infoBlock(verdict, t) {
    // The student line and the big seat row are centred; the facts below read left to right.
    var top = [who(verdict, t), hero(verdict, t)].filter(Boolean);
    return node('section', 'info', null, [
      top.length > 0 ? node('div', 'info-top', null, top) : null,
      facts(verdict, t)
    ]);
  }

  function planAria(t, verdict, layout) {
    var seat = verdict.seat;
    var base;
    if (seat === null) base = t('plan.ariaRoom', { room: verdict.room });
    else if (seat.side !== null) base = t('plan.ariaSeatSide', { room: verdict.room, desk: seat.desk, side: t('side.' + seat.side), row: seat.y, column: seat.x });
    else base = t('plan.ariaSeat', { room: verdict.room, desk: seat.desk, row: seat.y, column: seat.x });
    return layout.partial ? base + ' ' + t('plan.ariaPartial') : base;
  }

  /**
   * The dictionary key of the note under a partial plan (K-26). Two reasons give a desk-only plan and they say
   * different things: an inconsistent seat string (S1: the layout is not "unknown", the numbers disagree, and the
   * mismatch note below says so) and a seat beyond what a plan is drawn for (the layout really is not known). The
   * S1 text comes with and without the three dots; the dots are there only when something lies between the desk
   * and the board or the left edge. The second reason always has dots: a seat in the first row and column is a
   * front-row plan, any other seat leaves something undrawn, so there is no dotless text for it (K-27).
   */
  function partialNoteKey(verdict, layout) {
    if (layout.level !== 'desk-only') return 'plan.partial';
    if (verdict.plan.uncertain) return layout.dots.length > 0 ? 'plan.deskOnlyS1Dots' : 'plan.deskOnlyS1';
    return 'plan.deskOnlyDots';
  }

  /** Block B: the plan slot with its caption and notes, or null when the verdict has no plan to draw. */
  function planBlock(verdict, t, patternSeats) {
    var params = deps.verdict.layoutParamsFor(verdict);
    if (params === null) return null;
    params.patternSeats = patternSeats;
    var layout = deps.geometry.layoutRoom(params);
    var svg = deps.room.buildRoomSvg(layout, { board: t('plan.board'), ariaLabel: planAria(t, verdict, layout) },
      { displayWidth: PLAN_DISPLAY_WIDTH });
    svg = Object.assign({}, svg, { ns: deps.tree.SVG_NS });
    // "a = left, b = right" only where the plan draws a and b; the partial note only when the room goes on past what is drawn
    var showsSides = layout.desks.some(function (d) { return d.slots.length === 2; });
    var partialNote = layout.partial ? t(partialNoteKey(verdict, layout)) : null;
    return node('section', 'plan', null, [
      node('h2', 'plan-title', t('plan.title')),
      node('div', 'plan-figure', null, [svg]),
      showsSides ? node('p', 'plan-note', t('plan.sideNote')) : null,
      partialNote !== null ? node('p', 'plan-note plan-partial', partialNote) : null,
      verdict.plan.uncertain ? node('p', 'plan-mismatch', t('plan.mismatch'), null, { role: 'note' }) : null
    ]);
  }

  /** The footer: the K-03 disclaimer and, when the build gave a stamp, the version line. */
  function footer(t, opts) {
    // WP-08: one builder for both places the footer can stand (see buildPage)
    return node('footer', 'page-footer', null, [
      node('p', 'footer-text', t('footer.text')),
      opts.version ? node('p', 'footer-version', t('footer.version', { version: opts.version })) : null
    ]);
  }

  /**
   * The whole page for a verdict.
   *
   * @param {Object} verdict  from verdict.resolve() / verdict.evaluate()
   * @param {Object} translator  from i18n.create(): has t (Function) and list (Function)
   * @param {Object} [options]  version (string): the build stamp shown in the footer;
   *     patternSeats ('all' or 'own'): the site setting of contract section 6.4 (default 'all')
   * @returns {Object} tree (mount with dom-tree.mountTree) and title (the fixed document title)
   */
  function buildPage(verdict, translator, options) {
    var opts = options || {};
    var t = translatorFn(translator);
    var fatal = verdict.status === 'fatal';

    var bands = orderedCodes(verdict.codes).map(function (code) { return band(t, code); });
    if (fatal) bands.push(node('p', 'band-trailer', t('band.trailer')));

    var plan = fatal ? null : planBlock(verdict, t, opts.patternSeats === undefined ? DEFAULT_PATTERN_SEATS : opts.patternSeats);
    // WP-08: with blocks A and B the footer is the third item of the .split grid: on a wide landscape screen the
    // stylesheet puts it under block A and it breaks at A's width; in portrait it is simply last, at the page
    // width. A page without the blocks (fatal, message) keeps the footer as the last child of the page.
    var foot = footer(t, opts);
    var main = fatal ? null : node('div', 'split' + (plan === null ? ' split-single' : ''), null, [infoBlock(verdict, t), plan, foot]);

    var tree = node('div', 'page', null, [
      masthead(verdict, t),
      node('div', 'bands', null, bands),
      main === null ? foot : node('main', 'content', null, [main])
    ], { 'data-status': verdict.status });
    return { tree: tree, title: t('page.title') };
  }

  /** A page for situations outside the verdict logic (framed, unexpected error): masthead, one band, footer. */
  function buildMessagePage(translator, titleKey, textKey, options) {
    var t = translatorFn(translator);
    var opts = options || {};
    var body = node('div', 'band band-fatal', null, [
      titleKey ? node('p', 'band-title', t(titleKey)) : null,
      node('p', 'band-text', t(textKey))
    ], { role: 'alert' });
    return {
      tree: node('div', 'page', null, [
        node('header', 'masthead', null, [node('h1', 'masthead-title', t('page.title'))]),
        node('div', 'bands', null, [body]),
        footer(t, opts)
      ], { 'data-status': 'fatal' }),
      title: t('page.title')
    };
  }

  return {
    buildPage: buildPage,
    buildMessagePage: buildMessagePage,
    formatDate: formatDate,
    orderedCodes: orderedCodes,
    DEFAULT_PATTERN_SEATS: DEFAULT_PATTERN_SEATS
  };
});
