// WP-24: pure room geometry (no DOM, no I/O). Turns a plan description (entry-link-v2 section 6) into numbers.
//
// Orientation: the board is at the top, Y=1 is the front row (top), X=1 is the left column.
// Desk number = (Y - 1) * cols + X.
//
// The plan has one of four levels (contract section 6.3), and each draws a different part of the room:
//   full          the whole grid, cols x rows
//   rows-to-seat  `cols` columns, rows 1 .. y; the room goes on below, so a row of dots hangs under every column
//   front-row     desks 1 .. x of the front row; the row goes on to the right, so dots follow the last desk
//   desk-only     the board and the student's desk, labelled with its column x and row y; dots mark the rows
//                 and columns between the board (or the left edge) and the desk that are not drawn
// Desks are identical (K-13): every desk is `each` seat cells wide, `each` being the catalog's physical seats per
// desk when the catalog is the source, else the default that fits two seats. Only the student's desk shows seats:
// two people sit left (a) and right (b), one person in the middle. With a pattern `p` (and the site setting
// patternSeats = 'all') every desk shows the seats its column says. Other desks are an outline and a number.
// There is no damage: the catalog has none (K-23).
//
// Loaded as a classic <script> (browser: window.SGB.roomGeometry) and via require() (node:test).
// Classic scripts, not ES modules: an import does not inherit the importer's "?v=<z>" cache
// stamp, so modules could mix old and new files on GitHub Pages (see CONTEXT.md K-06).
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.roomGeometry = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // WP-24: layout constants in SVG user units (the viewBox scales to the container).
  var G = Object.freeze({
    SEAT_W: 32,      // width of one physical seat cell; a desk is `each` cells wide
    DESK_H: 46,
    SLOT_W: 26,      // seating-area box inside the desk
    SLOT_H: 20,
    SLOT_TOP: 21,    // seating-area top, from the desk top (the desk number sits above it)
    GAP_X: 16,       // between columns
    GAP_Y: 14,       // between rows
    PAD: 8,          // outer margin
    LABEL_W: 28,     // left gutter holding the Y labels
    BOARD_H: 24,
    LABEL_H: 20,     // top strip holding the X labels
    GAP_BOARD: 4,    // board -> X labels
    GAP_LABEL: 4,    // X labels -> first row
    NUMBER_DY: 14,   // desk number centre, from the desk top (a desk without seats centres its number instead)
    MARKER_R: 9,
    DEFAULT_EACH: 2, // desk width in seat cells when the catalog does not give one: fits a and b
    DOT_R: 2,        // the three dots that say "the room goes on": radius, step between centres, gap to the edge
    DOT_STEP: 8,
    DOT_GAP: 6,
    DOT_COUNT: 3,
    MAX_DIM: 40,     // sanity cap on cols and rows (contract: at most 20 columns and 40 rows)
    MAX_EACH: 6      // sanity cap on seats per desk (catalog: 1 to 6)
  });

  // Space taken by one run of dots: gap, then three dots of diameter 2 * DOT_R with DOT_STEP between centres.
  var CONT = G.DOT_GAP + 2 * G.DOT_R + (G.DOT_COUNT - 1) * G.DOT_STEP;

  var LEVELS = ['full', 'rows-to-seat', 'front-row', 'desk-only'];

  function isInt(n) {
    return typeof n === 'number' && Number.isInteger(n);
  }

  function requireIntBetween(name, value, min, max) {
    if (!isInt(value) || value < min || value > max) {
      throw new RangeError(name + ' must be an integer between ' + min + ' and ' + max + ', got ' + String(value));
    }
  }

  // WP-24: structural input errors throw: layoutParamsFor() (verdict.js) builds the parameters from a verdict
  // that already agrees with the seat string, so a violation here is a bug in the page, not bad link data.
  function validate(p) {
    if (LEVELS.indexOf(p.level) === -1) throw new RangeError('level must be one of ' + LEVELS.join(', ') + ', got ' + String(p.level));
    if (p.each !== null) requireIntBetween('each', p.each, 1, G.MAX_EACH);
    if (p.patternSeats !== 'all' && p.patternSeats !== 'own') throw new RangeError("patternSeats must be 'all' or 'own'");
    var s = p.seat;
    if (s !== null) {
      if (typeof s !== 'object') throw new TypeError('seat must be an object or null');
      requireIntBetween('seat.x', s.x, 1, 999);
      requireIntBetween('seat.y', s.y, 1, 999);
      requireIntBetween('seat.desk', s.desk, 1, 999);
      if (s.side !== null && s.side !== 'a' && s.side !== 'b') throw new RangeError("seat.side must be 'a', 'b' or null");
    }
    if (p.level === 'full') {
      requireIntBetween('cols', p.cols, 1, G.MAX_DIM);
      requireIntBetween('rows', p.rows, 1, G.MAX_DIM);
      if (s !== null && (s.x > p.cols || s.y > p.rows)) throw new RangeError('the seat lies outside the grid');
    } else {
      if (s === null) throw new TypeError('level ' + p.level + ' draws the seat\'s desk: seat is required');
      if (p.level === 'rows-to-seat') {
        requireIntBetween('cols', p.cols, 1, G.MAX_DIM);
        if (s.x > p.cols) throw new RangeError('the seat lies outside the columns');
        if (p.rows !== s.y) throw new RangeError('rows-to-seat draws rows 1 .. y: rows must equal seat.y');
      } else if (p.level === 'front-row') {
        if (s.y !== 1) throw new RangeError('front-row is for a seat in row 1');
        if (p.cols !== null && p.cols !== undefined) throw new RangeError('front-row does not know the columns: cols must be null');
      }
    }
    // Two people (a left, b right) need a desk of at least two seat cells; one cell would put them on top of each other.
    var cells = p.each === null ? G.DEFAULT_EACH : p.each;
    if (cells < 2 && ((s !== null && s.side !== null) || (Array.isArray(p.pattern) && p.pattern.indexOf(2) !== -1))) {
      throw new RangeError('two seats at one desk need each >= 2');
    }
    if (p.pattern !== null) {
      var known = p.level === 'full' || p.level === 'rows-to-seat';
      if (!known) throw new RangeError('a pattern needs known columns (levels full and rows-to-seat)');
      if (!Array.isArray(p.pattern) || p.pattern.length !== p.cols) {
        throw new RangeError('pattern must be an array with one entry per column (' + p.cols + ')');
      }
      p.pattern.forEach(function (v, i) {
        if (v !== 1 && v !== 2) throw new RangeError('pattern[' + i + '] must be 1 or 2, got ' + String(v));
      });
    }
  }

  /**
   * Lay out a plan.
   *
   * @param {Object} params
   * @param {string} params.level          'full', 'rows-to-seat', 'front-row' or 'desk-only'
   * @param {?number} params.cols          columns of the grid: full and rows-to-seat; null otherwise
   * @param {?number} params.rows          rows of the grid: full; for rows-to-seat the seat's row; null otherwise
   * @param {?number} [params.each]        physical seats per desk (sets the desk width); null or absent: two cells
   * @param {?number[]} [params.pattern]   people per desk for each column, 1 or 2 (length = cols); null or absent: none
   * @param {?{x:number, y:number, desk:number, side:?string}} [params.seat]  the student's seat; null for an overflow plan
   * @param {boolean} [params.uncertain]   draw the marker as uncertain (the seat string is inconsistent, S1)
   * @param {string} [params.patternSeats] site setting, 'all' (default): with a pattern every desk shows its seats;
   *                                       'own': only the student's desk does
   * @returns {Object} layout: {level, partial, cols, rows, deskCells, width, height, board, desks, xLabels, yLabels,
   *     marker, seat, dots}. `cols` and `rows` count the desks drawn; `dots` are the "goes on" circles.
   */
  function layoutRoom(params) {
    var p = Object.assign({ each: null, pattern: null, seat: null, uncertain: false, patternSeats: 'all' }, params || {});
    ['each', 'pattern', 'seat'].forEach(function (key) { if (p[key] === undefined) p[key] = null; });
    if (p.cols === undefined) p.cols = null;
    validate(p);

    var level = p.level;
    var seat = p.seat;
    var deskCells = p.each === null ? G.DEFAULT_EACH : p.each;
    var deskW = deskCells * G.SEAT_W;
    var gridLeft = G.PAD + G.LABEL_W;
    var gridTop = G.PAD + G.BOARD_H + G.GAP_BOARD + G.LABEL_H + G.GAP_LABEL;

    // How many desks are drawn, and where the grid starts for desk-only (dots between it and the board / left edge).
    var drawnCols;
    var drawnRows;
    var leftGap = 0;
    var topGap = 0;
    if (level === 'full') { drawnCols = p.cols; drawnRows = p.rows; }
    else if (level === 'rows-to-seat') { drawnCols = p.cols; drawnRows = seat.y; }
    else if (level === 'front-row') { drawnCols = seat.x; drawnRows = 1; }
    else {
      drawnCols = 1;
      drawnRows = 1;
      if (seat.x > 1) leftGap = CONT;
      if (seat.y > 1) topGap = CONT;
    }
    var deskLeft = gridLeft + leftGap;
    var deskTop = gridTop + topGap;
    var gridRight = deskLeft + drawnCols * deskW + (drawnCols - 1) * G.GAP_X;
    var gridBottom = deskTop + drawnRows * G.DESK_H + (drawnRows - 1) * G.GAP_Y;
    var extraRight = level === 'front-row' ? CONT : 0;
    var extraBottom = level === 'rows-to-seat' ? CONT : 0;

    var dots = [];
    function addDots(x0, y0, dx, dy) {
      for (var i = 0; i < G.DOT_COUNT; i++) {
        dots.push({ x: x0 + i * dx, y: y0 + i * dy, r: G.DOT_R });
      }
    }
    var firstDot = G.DOT_GAP + G.DOT_R;   // centre of the first dot, from the edge it hangs from

    // A seating-area box centred at cx inside the desk at (deskX, deskY).
    function slot(side, cx, deskY, highlighted) {
      return {
        side: side,
        x: cx - G.SLOT_W / 2,
        y: deskY + G.SLOT_TOP,
        w: G.SLOT_W,
        h: G.SLOT_H,
        cx: cx,
        cy: deskY + G.SLOT_TOP + G.SLOT_H / 2,
        highlighted: highlighted
      };
    }

    var desks = [];
    var student = null;   // the desk object of the student
    for (var r = 0; r < drawnRows; r++) {
      var deskY = deskTop + r * (G.DESK_H + G.GAP_Y);
      for (var k = 0; k < drawnCols; k++) {
        var col = level === 'desk-only' ? seat.x : k + 1;
        var row = level === 'desk-only' ? seat.y : r + 1;
        var number = level === 'desk-only' ? seat.desk : (level === 'front-row' ? k + 1 : r * p.cols + k + 1);
        var dx = deskLeft + k * (deskW + G.GAP_X);
        var cx = dx + deskW / 2;
        var isStudent = seat !== null && col === seat.x && row === seat.y;
        // Who sits here: the student's desk follows the seat string (a and b, or one in the middle); the others follow
        // the pattern when there is one and the setting says all desks; otherwise no seats are drawn.
        var people = 0;
        if (isStudent) people = seat.side !== null ? 2 : 1;
        else if (p.pattern !== null && p.patternSeats === 'all') people = p.pattern[col - 1];
        var slots = [];
        if (people === 2) {
          // a = left seat cell, b = right seat cell (first and last cell of the desk)
          slots = [
            slot('a', dx + G.SEAT_W / 2, deskY, isStudent && seat.side === 'a'),
            slot('b', dx + deskW - G.SEAT_W / 2, deskY, isStudent && seat.side === 'b')
          ];
        } else if (people === 1) {
          slots = [slot(null, cx, deskY, isStudent)];
        }
        var desk = {
          number: number,
          col: col,
          row: row,
          people: people,
          x: dx,
          y: deskY,
          w: deskW,
          h: G.DESK_H,
          cx: cx,
          cy: deskY + G.DESK_H / 2,
          // a desk with seats keeps its number above them; a desk without seats centres it
          numberPos: { x: cx, y: slots.length > 0 ? deskY + G.NUMBER_DY : deskY + G.DESK_H / 2 },
          highlighted: isStudent,
          slots: slots
        };
        desks.push(desk);
        if (isStudent) student = desk;
      }
    }

    // Marker: left seat (a), right seat (b), or the middle seat of a one-person desk.
    var marker = null;
    if (student !== null) {
      var chosen = student.slots.filter(function (s) { return s.highlighted; })[0];
      marker = {
        x: chosen.cx,
        y: chosen.cy,
        r: G.MARKER_R,
        desk: student.number,
        side: seat.side,
        placement: seat.side === 'a' ? 'left' : (seat.side === 'b' ? 'right' : 'center'),
        uncertain: p.uncertain === true
      };
    }

    // The room goes on: below every column (rows-to-seat), right of the last desk (front-row), or between the
    // board / left edge and the lone desk (desk-only).
    if (level === 'rows-to-seat') {
      desks.slice(0, drawnCols).forEach(function (d) { addDots(d.cx, gridBottom + firstDot, 0, G.DOT_STEP); });
    } else if (level === 'front-row') {
      addDots(gridRight + firstDot, desks[0].cy, G.DOT_STEP, 0);
    } else if (level === 'desk-only') {
      if (topGap > 0) addDots(student.cx, gridTop + firstDot, 0, G.DOT_STEP);
      if (leftGap > 0) addDots(gridLeft + firstDot, student.cy, G.DOT_STEP, 0);
    }

    // Axis labels; the student's column and row are emphasised. A desk-only plan labels its one desk with the
    // column and row of the seat string (those numbers are the information).
    var labelY = G.PAD + G.BOARD_H + G.GAP_BOARD + G.LABEL_H / 2;
    var xLabels = desks.slice(0, drawnCols).map(function (d) {
      return { value: d.col, x: d.cx, y: labelY, emphasized: seat !== null && d.col === seat.x };
    });
    var labelX = G.PAD + G.LABEL_W / 2;
    var yLabels = [];
    for (var j = 0; j < drawnRows; j++) {
      var first = desks[j * drawnCols];
      yLabels.push({ value: first.row, x: labelX, y: first.cy, emphasized: seat !== null && first.row === seat.y });
    }

    return {
      level: level,
      partial: level !== 'full',
      cols: drawnCols,
      rows: drawnRows,
      deskCells: deskCells,
      width: gridRight + extraRight + G.PAD,
      height: gridBottom + extraBottom + G.PAD,
      board: { x: deskLeft, y: G.PAD, w: gridRight - deskLeft + extraRight, h: G.BOARD_H },
      desks: desks,
      xLabels: xLabels,
      yLabels: yLabels,
      marker: marker,
      seat: seat === null ? null : { x: seat.x, y: seat.y, desk: seat.desk, side: seat.side },
      dots: dots
    };
  }

  return { layoutRoom: layoutRoom, GEOMETRY: G, LEVELS: LEVELS.slice() };
});
