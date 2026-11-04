// WP-24: room floor plan (block B) as a self-contained SVG.
//
// Two layers, so almost everything is testable without a DOM:
//   buildRoomSvg(layout, labels)  pure: layout (room-geometry.js) -> plain {tag, attrs, children, text} tree
//   mountSvgTree(doc, parent, tree)  the only DOM-touching function; text goes in via textContent
//
// Self-contained on purpose: every colour, stroke and font is a presentation attribute. No class,
// no style attribute, no <style>, no <defs>/<pattern>/<clipPath>. Page CSS cannot change it and
// svg2pdf.js (v0.3) can draw it without a rewrite. The "room goes on" mark of a partial plan is three plain
// circles, not a font glyph, for the same reason.
//
// No natural-language text lives here: the caller passes labels from the dictionary (i18n).
// Classic <script> (window.SGB.renderRoom) / require() (node:test); see room-geometry.js for why.
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module !== null && module.exports;
  var geometry = isNode ? require('./room-geometry.js') : (root.SGB && root.SGB.roomGeometry);
  var domTree = isNode ? require('./dom-tree.js') : (root.SGB && root.SGB.domTree);
  // Fail at load time: the script order is dom-tree.js, room-geometry.js, then render-room.js.
  if (!geometry || !domTree) throw new TypeError('render-room.js needs room-geometry.js and dom-tree.js to be loaded first');
  var api = factory(geometry, domTree);
  if (isNode) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.renderRoom = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (geometry, domTree) {
  'use strict';

  var SVG_NS = domTree.SVG_NS;

  // WP-07: colour roles. X green / Y blue match the colour-coded location string in block A.
  var PALETTE = Object.freeze({
    paper: '#F3F5F7',
    desk: '#FFFFFF',
    deskLine: '#7A8794',
    ink: '#3B4652',
    inkSoft: '#5B6672',
    board: '#33423C',
    boardInk: '#EEF3EF',
    slotFill: '#EDF1F5',
    slotLine: '#AEB8C3',
    highlightFill: '#FFE8A3',
    highlightSlot: '#FFD25A',
    highlightLine: '#B45309',
    marker: '#1F2933',
    markerRing: '#FFFFFF',
    xInk: '#14632D',
    xPill: '#DDF1E3',
    yInk: '#1D4F9F',
    yPill: '#DCE8FA'
  });

  var FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  // Cap-height centring without dominant-baseline (poorly supported by svg2pdf): the visual
  // centre of a digit sits about 0.36 em above the alphabetic baseline.
  var BASELINE_SHIFT = 0.36;

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function el(tag, attrs, children, text) {
    var node = { tag: tag, attrs: attrs };
    if (children && children.length) node.children = children;
    if (text !== undefined) node.text = String(text);
    return node;
  }

  function textEl(x, y, size, weight, fill, text) {
    return el('text', {
      x: x,
      y: round2(y + size * BASELINE_SHIFT),
      'text-anchor': 'middle',
      'font-family': FONT,
      'font-size': size,
      'font-weight': weight,
      fill: fill
    }, null, text);
  }

  function deskNodes(desk) {
    var nodes = [];
    nodes.push(el('rect', { x: desk.x, y: desk.y, width: desk.w, height: desk.h, rx: 3, fill: desk.highlighted ? PALETTE.highlightFill : PALETTE.desk }));

    // Seating areas (the student's desk, or every desk when a pattern is used): small boxes inside the identical
    // desk, centred for one person, left and right for two. The student's one is stronger amber. A desk without
    // seats is just the outline and its number.
    desk.slots.forEach(function (slot) {
      nodes.push(el('rect', {
        x: slot.x, y: slot.y, width: slot.w, height: slot.h, rx: 3,
        fill: slot.highlighted ? PALETTE.highlightSlot : PALETTE.slotFill,
        stroke: slot.highlighted ? PALETTE.highlightLine : PALETTE.slotLine,
        'stroke-width': slot.highlighted ? 1.5 : 1
      }));
    });

    nodes.push(el('rect', {
      x: desk.x, y: desk.y, width: desk.w, height: desk.h, rx: 3, fill: 'none',
      stroke: desk.highlighted ? PALETTE.highlightLine : PALETTE.deskLine,
      'stroke-width': desk.highlighted ? 2.5 : 1.25
    }));

    nodes.push(textEl(desk.numberPos.x, desk.numberPos.y, 12, 700, PALETTE.ink, desk.number));
    if (desk.slots.length === 2) {
      // Side letters above their seating areas, clear of the centred desk number and the marker.
      desk.slots.forEach(function (slot) {
        nodes.push(textEl(slot.cx, desk.numberPos.y, 9, 600, PALETTE.inkSoft, slot.side));
      });
    }
    return nodes;
  }

  function axisLabelNodes(label, axis) {
    var nodes = [];
    var ink = axis === 'x' ? PALETTE.xInk : PALETTE.yInk;
    var pill = axis === 'x' ? PALETTE.xPill : PALETTE.yPill;
    if (label.emphasized) {
      nodes.push(el('rect', {
        x: label.x - 11, y: label.y - 9, width: 22, height: 18, rx: 9, fill: pill
      }));
      nodes.push(textEl(label.x, label.y, 13, 700, ink, label.value));
    } else {
      nodes.push(textEl(label.x, label.y, 11, 400, PALETTE.inkSoft, label.value));
    }
    return nodes;
  }

  function markerNodes(layout) {
    var m = layout.marker;
    if (!m) return [];
    if (m.uncertain) {
      // The seat string is inconsistent (S1): a hollow dashed ring says "about here", not "exactly here".
      return [
        el('circle', {
          cx: m.x, cy: m.y, r: m.r, fill: PALETTE.markerRing, stroke: PALETTE.marker,
          'stroke-width': 2, 'stroke-dasharray': '3 2'
        }),
        textEl(m.x, m.y, 11, 700, PALETTE.marker, '?')
      ];
    }
    return [
      el('circle', { cx: m.x, cy: m.y, r: m.r + 3, fill: PALETTE.highlightLine, 'fill-opacity': 0.22 }),
      el('circle', {
        cx: m.x, cy: m.y, r: m.r, fill: PALETTE.marker, stroke: PALETTE.markerRing, 'stroke-width': 2
      })
    ];
  }

  function requireLabel(labels, key) {
    if (!labels || typeof labels[key] !== 'string' || labels[key] === '') {
      throw new TypeError('labels.' + key + ' is required (text comes from the dictionary, not from here)');
    }
    return labels[key];
  }

  /**
   * Build the SVG node tree for a laid-out plan.
   *
   * @param {Object} layout  result of roomGeometry.layoutRoom()
   * @param {Object} labels  dictionary strings: board and ariaLabel (both strings)
   * @param {Object} [options]
   *     displayWidth: the width in CSS pixels the plan should aim for; see displayScale().
   * @returns {Object} a tree node: tag (string), attrs (Object), children (Array)
   */
  function buildRoomSvg(layout, labels, options) {
    var boardText = requireLabel(labels, 'board');
    var ariaLabel = requireLabel(labels, 'ariaLabel');
    var scale = displayScale(layout, options && options.displayWidth);

    var children = [];
    children.push(el('rect', {
      x: 0, y: 0, width: layout.width, height: layout.height, rx: 8, fill: PALETTE.paper
    }));

    var b = layout.board;
    children.push(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, fill: PALETTE.board }));
    children.push(textEl(b.x + b.w / 2, b.y + b.h / 2, 11, 600, PALETTE.boardInk, boardText));

    layout.xLabels.forEach(function (t) { children = children.concat(axisLabelNodes(t, 'x')); });
    layout.yLabels.forEach(function (t) { children = children.concat(axisLabelNodes(t, 'y')); });
    layout.desks.forEach(function (d) { children = children.concat(deskNodes(d)); });
    // "The room goes on" (a partial plan): three dots, plain circles.
    layout.dots.forEach(function (d) {
      children.push(el('circle', { cx: round2(d.x), cy: round2(d.y), r: d.r, fill: PALETTE.inkSoft }));
    });
    children = children.concat(markerNodes(layout));

    return el('svg', {
      viewBox: '0 0 ' + layout.width + ' ' + layout.height,
      width: Math.round(layout.width * scale),
      height: Math.round(layout.height * scale),
      role: 'img',
      'aria-label': ariaLabel,
      focusable: 'false'
    }, children);
  }

  /**
   * How much to scale the plan's intrinsic size so that it aims for `target` CSS pixels wide, between
   * 1x and 2x: a narrow room (2 columns of one-seat desks is only 124 units wide) is enlarged so its desk
   * numbers stay readable, but never beyond 2x, and a wide room is not shrunk here (the page's CSS
   * max-width does that on a narrow screen). Without a usable target: 1.
   */
  function displayScale(layout, target) {
    if (typeof target !== 'number' || !isFinite(target) || target <= 0) return 1;
    return Math.min(2, Math.max(1, target / layout.width));
  }

  /**
   * Create the DOM for a plan tree and append it to `parent` (all nodes in the SVG namespace; text only
   * through textContent; event-handler, style and URL attributes refused: see dom-tree.js).
   *
   * @param {Document} doc
   * @param {Element} parent
   * @param {Object} tree  result of buildRoomSvg()
   * @returns {Element} the created root element
   */
  function mountSvgTree(doc, parent, tree) {
    return domTree.mountTree(doc, parent, Object.assign({}, tree, { ns: SVG_NS }));
  }

  return {
    buildRoomSvg: buildRoomSvg,
    mountSvgTree: mountSvgTree,
    displayScale: displayScale,
    PALETTE: PALETTE,
    SVG_NS: SVG_NS
  };
});
