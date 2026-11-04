// WP-06: the one place that turns a plain {tag, attrs, children, text} tree into DOM nodes.
//
// Every page and plan builder produces such trees (pure, testable without a DOM); this file mounts them.
// Defence in depth for the "no HTML parsing" rule (entry-link-v1 section 8): text goes in through
// textContent only, attribute names are checked (no event handlers, style, or URL attributes), tag names
// are allow-listed, and a node may switch to another namespace (SVG) with `ns`, inherited by its children.
//
// Loaded as a classic <script> (browser: window.SGB.domTree) and via require() (node:test).
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = api;
  } else {
    root.SGB = root.SGB || {};
    root.SGB.domTree = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Elements the page may create. Anything else (script, style, iframe, a, img, ...) is refused.
  var HTML_TAGS = {
    div: 1, span: 1, p: 1, h1: 1, h2: 1, h3: 1, header: 1, main: 1, footer: 1, section: 1, strong: 1,
    small: 1, ul: 1, li: 1, dl: 1, dt: 1, dd: 1, figure: 1, figcaption: 1
  };
  var SVG_TAGS = { svg: 1, rect: 1, line: 1, circle: 1, text: 1 };

  // Attribute names refused however they got into a tree: event handlers, style, URL-bearing attributes.
  var FORBIDDEN_ATTR = /^(on|style$|href$|xlink:href$|src$|srcdoc$|action$|formaction$)/i;
  var ATTR_NAME = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;

  /**
   * Create the DOM for `tree` and append it to `parent`.
   *
   * @param {Document} doc
   * @param {Element} parent
   * @param {Object} tree  a tree node: tag (string), optional attrs (Object), children (Array), text (string), ns (string)
   * @param {string} [inheritedNs]  namespace of the parent (internal)
   * @returns {Element} the created root element
   */
  function mountTree(doc, parent, tree, inheritedNs) {
    var ns = tree.ns || inheritedNs || null;
    var allowed = ns === SVG_NS ? SVG_TAGS : HTML_TAGS;
    if (typeof tree.tag !== 'string' || !Object.prototype.hasOwnProperty.call(allowed, tree.tag)) {
      throw new TypeError('element not allowed: ' + String(tree.tag));
    }
    if (ns !== null && ns !== SVG_NS) throw new TypeError('namespace not allowed');
    var node = ns === SVG_NS ? doc.createElementNS(SVG_NS, tree.tag) : doc.createElement(tree.tag);
    Object.keys(tree.attrs || {}).forEach(function (name) {
      if (!ATTR_NAME.test(name) || FORBIDDEN_ATTR.test(name)) throw new TypeError('attribute not allowed: ' + name);
      node.setAttribute(name, String(tree.attrs[name]));
    });
    if (tree.text !== undefined) node.textContent = tree.text;
    (tree.children || []).forEach(function (child) { mountTree(doc, node, child, ns); });
    parent.appendChild(node);
    return node;
  }

  return { mountTree: mountTree, SVG_NS: SVG_NS };
});
