// WP-08: fits the seat block's type to the room and desk blocks, by measuring.
//
// The CSS sizes the seat block's two value lines from a formula (see style.css, --v), which assumes a typical
// font. Fonts differ: the baseline of a line sits at a different distance from the bottom of its box in Segoe UI,
// Roboto and SF, so the formula can leave the last baseline of the seat block a few pixels off the baseline of the
// big digits. This script measures the real baselines and scales the seat block's values (the --vk multiplier on
// .hero) until the two baselines coincide. Tops already coincide (the blocks are top-aligned), so the labels line
// up too. Nothing is drawn differently without this script; the CSS alone is already within a few pixels.
//
// Only CSSOM is used (style.setProperty): the page's CSP forbids style attributes, not CSSOM changes.
//
// Loaded as a classic <script> (browser: window.SGB.fit) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.fit = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TOLERANCE = 0.4;       // px: stop when the baselines are this close
  var MAX_STEPS = 5;
  var SLOPE = 1.8;           // d(last baseline of the seat block) / d(v): two value lines, about 0.95 + 0.85 each
  var K_MIN = 0.6;
  var K_MAX = 1.6;

  /** y of the baseline of a block element's last line: the bottom of a zero-size inline-block placed on it. */
  function baselineOf(element) {
    var probe = element.ownerDocument.createElement('span');
    probe.style.display = 'inline-block';
    probe.style.width = '0';
    probe.style.height = '0';
    element.appendChild(probe);
    var y = probe.getBoundingClientRect().bottom;
    element.removeChild(probe);
    return y;
  }

  /**
   * Scale the seat block values of the .hero inside `container` until their baseline matches the desk number's.
   *
   * @param {Element} container  an element that may contain a .hero (the page root)
   * @returns {number|null} the multiplier applied (1 = the CSS formula was exact), or null when there is nothing to fit
   */
  function fitSeatBlock(container) {
    if (!container || typeof container.querySelector !== 'function') return null;
    var hero = container.querySelector('.hero');
    var desk = hero && hero.querySelector('.hero-desk .hero-value');
    // WP-08: K-21: the LAST value of the seat block is the one that must stand on the desk number's baseline: the
    // seat ("Sol (a)") when the seat string has a letter, the row (Sira) in the stacked column-over-row form
    var values = hero ? hero.querySelectorAll('.hero-seat .hero-value') : null;
    var side = values && values.length > 0 ? values[values.length - 1] : null;
    if (!hero || !desk || !side || typeof side.getBoundingClientRect !== 'function') return null;

    var k = 1;
    hero.style.setProperty('--vk', '1');
    for (var i = 0; i < MAX_STEPS; i++) {
      var diff = baselineOf(desk) - baselineOf(side); // > 0: the seat block ends too high, make it taller
      if (Math.abs(diff) < TOLERANCE) break;
      var size = parseFloat(window.getComputedStyle(side).fontSize);
      if (!(size > 0)) break;
      k = Math.min(K_MAX, Math.max(K_MIN, k * ((size + diff / SLOPE) / size)));
      hero.style.setProperty('--vk', String(k));
    }
    return k;
  }

  var observer = null;

  /**
   * Fit now, and again whenever the page's top block changes size (rotation, window resize).
   * Calling it again replaces the previous observer.
   */
  function install(container) {
    if (observer) { observer.disconnect(); observer = null; }
    fitSeatBlock(container);
    var target = container && typeof container.querySelector === 'function' ? container.querySelector('.info-top') : null;
    if (target && typeof window.ResizeObserver === 'function') {
      var pending = false;
      observer = new window.ResizeObserver(function () {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(function () { pending = false; fitSeatBlock(container); });
      });
      observer.observe(target);
    }
  }

  return { fitSeatBlock: fitSeatBlock, install: install, baselineOf: baselineOf };
});
