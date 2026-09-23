(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // wp:@wordpress/hooks
  var require_hooks = __commonJS({
    "wp:@wordpress/hooks"(exports, module) {
      module.exports = window.wp["hooks"];
    }
  });

  // wp:@wordpress/compose
  var require_compose = __commonJS({
    "wp:@wordpress/compose"(exports, module) {
      module.exports = window.wp["compose"];
    }
  });

  // wp:@wordpress/data
  var require_data = __commonJS({
    "wp:@wordpress/data"(exports, module) {
      module.exports = window.wp["data"];
    }
  });

  // wp:@wordpress/blocks
  var require_blocks = __commonJS({
    "wp:@wordpress/blocks"(exports, module) {
      module.exports = window.wp["blocks"];
    }
  });

  // wp:@wordpress/element
  var require_element = __commonJS({
    "wp:@wordpress/element"(exports, module) {
      module.exports = window.wp["element"];
    }
  });

  // wp:@wordpress/block-editor
  var require_block_editor = __commonJS({
    "wp:@wordpress/block-editor"(exports, module) {
      module.exports = window.wp["blockEditor"];
    }
  });

  // wp:@wordpress/components
  var require_components = __commonJS({
    "wp:@wordpress/components"(exports, module) {
      module.exports = window.wp["components"];
    }
  });

  // wp:@wordpress/media-utils
  var require_media_utils = __commonJS({
    "wp:@wordpress/media-utils"(exports, module) {
      module.exports = window.wp["mediaUtils"];
    }
  });

  // wp:@wordpress/i18n
  var require_i18n = __commonJS({
    "wp:@wordpress/i18n"(exports, module) {
      module.exports = window.wp["i18n"];
    }
  });

  // ../../sessions/sweet-adoring-lamport/mnt/GitHub/jamies-visual-html-editor/src/index.js
  var import_hooks = __toESM(require_hooks());
  var import_compose = __toESM(require_compose());
  var import_data = __toESM(require_data());
  var import_blocks = __toESM(require_blocks());
  var import_element = __toESM(require_element());
  var import_block_editor = __toESM(require_block_editor());
  var import_components = __toESM(require_components());
  var import_media_utils = __toESM(require_media_utils());
  var import_i18n = __toESM(require_i18n());
  var EDITABLE_ATTR = "data-vc-editable";
  var IMAGE_ATTR = "data-vc-image";
  var IMAGE_WRAP_ATTR = "data-vc-image-wrap";
  var IMAGE_SELECTED = "vc-image-selected";
  var IMAGE_UPDATED = "vc-image-updated";
  var LINK_ATTR = "data-vc-link";
  var LINK_WRAP_ATTR = "data-vc-link-wrap";
  var LINK_SELECTED = "vc-link-selected";
  var LINK_UPDATED = "vc-link-updated";
  var BG_STYLE_INDEX_ATTR = "data-vc-bg-style-index";
  var BG_SELECTOR_ATTR = "data-vc-bg-selector";
  var BG_EDITOR = "vc-bg-editor";
  var BG_SELECTED = "vc-bg-selected";
  var BG_UPDATED = "vc-bg-updated";
  var URL_REGEX = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;
  var FEEDBACK_DELAY = 2e3;
  function readImage(img) {
    return {
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || ""
    };
  }
  function applyImageToElement(img, changes) {
    if (changes.src !== void 0) {
      img.setAttribute("src", changes.src);
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    if (changes.alt !== void 0) {
      img.setAttribute("alt", changes.alt);
    }
  }
  function readLink(anchor) {
    return {
      href: anchor.getAttribute("href") || "",
      text: (anchor.innerText || anchor.textContent || "").trim(),
      newTab: anchor.getAttribute("target") === "_blank"
    };
  }
  function applyLinkToElement(anchor, changes) {
    if (changes.href !== void 0) {
      anchor.setAttribute("href", changes.href);
    }
    if (changes.text !== void 0) {
      anchor.textContent = changes.text;
    }
    if (changes.newTab !== void 0) {
      if (changes.newTab) {
        anchor.setAttribute("target", "_blank");
      } else {
        anchor.removeAttribute("target");
      }
    }
  }
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function extractInlineBgUrl(element) {
    const sources = [
      element.style.backgroundImage,
      element.getAttribute("style") || ""
    ];
    for (const source of sources) {
      if (!source || source === "none") {
        continue;
      }
      const matches = [...String(source).matchAll(URL_REGEX)];
      if (matches.length) {
        return matches[matches.length - 1][2];
      }
    }
    return "";
  }
  function getStyleRuleRef(element, root) {
    const index = element.getAttribute(BG_STYLE_INDEX_ATTR);
    const selector = element.getAttribute(BG_SELECTOR_ATTR);
    if (index === null || !selector || !root) {
      return null;
    }
    const styleEl = root.querySelectorAll("style")[parseInt(index, 10)];
    return styleEl ? { styleEl, selector } : null;
  }
  function readBgUrlFromStyleRule(styleEl, selector) {
    const css = styleEl.textContent || "";
    const ruleRegex = new RegExp(
      escapeRegExp(selector.trim()) + "\\s*\\{([^}]*)\\}",
      "i"
    );
    const match = css.match(ruleRegex);
    if (!match) {
      return "";
    }
    const urls = [...String(match[1]).matchAll(URL_REGEX)];
    return urls.length ? urls[urls.length - 1][2] : "";
  }
  function setUrlInBackground(declaration, url) {
    const urlValue = 'url("' + url.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '")';
    let match;
    let last = null;
    URL_REGEX.lastIndex = 0;
    while ((match = URL_REGEX.exec(declaration)) !== null) {
      last = match;
    }
    if (!last) {
      const trimmed = declaration.trim();
      let separator = "";
      if (trimmed) {
        separator = trimmed.endsWith(";") ? " " : "; ";
      }
      return trimmed + separator + "background-image: " + urlValue;
    }
    return declaration.slice(0, last.index) + urlValue + declaration.slice(last.index + last[0].length);
  }
  function writeBgUrlToStyleRule(styleEl, selector, url) {
    const css = styleEl.textContent || "";
    const ruleRegex = new RegExp(
      "(\\s*" + escapeRegExp(selector.trim()) + "\\s*\\{)([^}]*)(\\})",
      "i"
    );
    const match = css.match(ruleRegex);
    if (match) {
      styleEl.textContent = css.replace(
        ruleRegex,
        match[1] + setUrlInBackground(match[2], url) + match[3]
      );
    }
  }
  function readElementBgUrl(element, root) {
    const ref = getStyleRuleRef(element, root);
    if (ref) {
      return { url: readBgUrlFromStyleRule(ref.styleEl, ref.selector) };
    }
    return { url: extractInlineBgUrl(element) };
  }
  function applyBgToElement(element, root, changes) {
    if (changes.url === void 0) {
      return;
    }
    const ref = getStyleRuleRef(element, root);
    if (ref) {
      writeBgUrlToStyleRule(ref.styleEl, ref.selector, changes.url);
      return;
    }
    const style = element.getAttribute("style") || "";
    element.setAttribute(
      "style",
      changes.url ? setUrlInBackground(style, changes.url) : style.replace(/background-image\s*:\s*[^;]+;?\s*/gi, "")
    );
  }
  function decorateBgElement(element, doc) {
    if (element.classList.contains(BG_EDITOR)) {
      return;
    }
    element.classList.add(BG_EDITOR);
    const badge = doc.createElement("button");
    badge.type = "button";
    badge.className = "vc-bg-editor__badge";
    badge.textContent = (0, import_i18n.__)("Edit background", "jamies-visual-html-editor");
    element.appendChild(badge);
  }
  function preventLinkClick(event) {
    event.preventDefault();
  }
  function decorateText(container) {
    container.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, li, span, a, button, blockquote, figcaption, label, strong, em"
    ).forEach((element) => {
      if (element.closest("style, script, svg")) {
        return;
      }
      if (element.parentElement && element.parentElement.closest("[" + EDITABLE_ATTR + "]")) {
        return;
      }
      element.setAttribute("contenteditable", "true");
      element.setAttribute(EDITABLE_ATTR, "1");
      element.setAttribute("spellcheck", "true");
      if (element.tagName === "A") {
        element.addEventListener("click", preventLinkClick);
      }
    });
    container.querySelectorAll("style, script, svg").forEach(
      (element) => element.setAttribute("contenteditable", "false")
    );
  }
  function imageSizedByAncestor(img) {
    const inline = (img.getAttribute("style") || "").toLowerCase();
    if (/height\s*:\s*[0-9.]+\s*%/.test(inline)) {
      return true;
    }
    const view = img.ownerDocument && img.ownerDocument.defaultView;
    if (view) {
      const pos = view.getComputedStyle(img).position;
      if (pos === "absolute" || pos === "fixed") {
        return true;
      }
    }
    return false;
  }
  function decorateImages(container) {
    container.querySelectorAll("img").forEach((img) => {
      if (img.closest("svg") || img.closest("[" + IMAGE_WRAP_ATTR + "]")) {
        return;
      }
      img.setAttribute("contenteditable", "false");
      img.setAttribute(IMAGE_ATTR, "1");
      const doc = container.ownerDocument;
      const wrap = doc.createElement("span");
      wrap.className = "vc-image-editor";
      wrap.setAttribute(IMAGE_WRAP_ATTR, "1");
      const badge = doc.createElement("span");
      badge.className = "vc-image-editor__badge";
      badge.textContent = (0, import_i18n.__)("Edit image", "jamies-visual-html-editor");
      const parent = img.parentNode;
      if (parent) {
        parent.insertBefore(wrap, img);
        wrap.appendChild(img);
        wrap.appendChild(badge);
        if (imageSizedByAncestor(img)) {
          wrap.classList.add("vc-image-editor--bare");
        }
      }
    });
  }
  function decorateLinks(container) {
    container.querySelectorAll("a[href]").forEach((anchor) => {
      if (anchor.closest("svg") || anchor.closest("[" + LINK_WRAP_ATTR + "]")) {
        return;
      }
      anchor.setAttribute(LINK_ATTR, "1");
      const doc = container.ownerDocument;
      const wrap = doc.createElement("span");
      wrap.className = "vc-link-editor";
      wrap.setAttribute(LINK_WRAP_ATTR, "1");
      const badge = doc.createElement("button");
      badge.type = "button";
      badge.className = "vc-link-editor__badge";
      badge.textContent = (0, import_i18n.__)("Edit link", "jamies-visual-html-editor");
      const parent = anchor.parentNode;
      if (parent) {
        parent.insertBefore(wrap, anchor);
        wrap.appendChild(anchor);
        wrap.appendChild(badge);
      }
    });
  }
  function collectBgStyleRules(container) {
    const rules = [];
    container.querySelectorAll("style").forEach((styleEl, styleIndex) => {
      const css = styleEl.textContent || "";
      const ruleRegex = /([^{]+)\{([^}]+)\}/g;
      let match;
      while ((match = ruleRegex.exec(css)) !== null) {
        const selector = match[1].trim();
        const body = match[2];
        if (selector && /background/i.test(body) && /url\s*\(/i.test(body)) {
          rules.push({ styleEl, styleIndex, selector });
        }
      }
    });
    return rules;
  }
  function decorateBackgrounds(container) {
    container.querySelectorAll("[data-vc-bg]").forEach((element) => {
      if (!element.closest("svg")) {
        decorateBgElement(element, container.ownerDocument);
      }
    });
    collectBgStyleRules(container).forEach(({ styleIndex, selector }) => {
      let nodes;
      try {
        nodes = container.querySelectorAll(selector);
      } catch (error) {
        return;
      }
      nodes.forEach((node) => {
        if (!node.closest("style, script, svg") && container.contains(node)) {
          node.setAttribute(BG_STYLE_INDEX_ATTR, String(styleIndex));
          node.setAttribute(BG_SELECTOR_ATTR, selector);
          decorateBgElement(node, container.ownerDocument);
        }
      });
    });
  }
  function injectEditStyles(doc) {
    if (!doc) {
      return;
    }
    let styleEl = doc.getElementById("vc-inline-edit-styles");
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "vc-inline-edit-styles";
      (doc.head || doc.body).appendChild(styleEl);
    }
    styleEl.textContent = `
		.vc-edit-surface [${EDITABLE_ATTR}] {
			cursor: text;
			transition: outline-color 120ms ease, background-color 120ms ease;
			outline: 1px dashed transparent;
			outline-offset: 2px;
			border-radius: 2px;
		}
		.vc-edit-surface [${EDITABLE_ATTR}]:hover {
			outline-color: rgba(0, 124, 186, 0.6);
			background-color: rgba(0, 124, 186, 0.06);
		}
		.vc-edit-surface [${EDITABLE_ATTR}]:focus {
			outline: 2px solid #007cba;
			outline-offset: 2px;
			background-color: rgba(0, 124, 186, 0.08);
		}
		.vc-edit-surface [${IMAGE_ATTR}] {
			cursor: pointer;
			pointer-events: auto !important;
			transition: outline-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
			outline: 1px dashed transparent;
			outline-offset: 2px;
			display: block;
			max-width: 100%;
			height: auto;
		}
		.vc-edit-surface .vc-image-editor {
			position: relative;
			display: inline-block;
			max-width: 100%;
			line-height: 0;
		}
		/*
		 * Ancestor-sized images (absolute/fixed, or percentage height) break
		 * inside the positioned, zero-height wrapper above, so their wrapper is
		 * made layout-transparent: it generates no box, the image measures
		 * against its real ancestor (as on the front end), and the centred
		 * badge \u2014 which has nothing to anchor to \u2014 is hidden. The image still
		 * shows its hover outline and stays click-to-edit.
		 */
		.vc-edit-surface .vc-image-editor--bare {
			display: contents;
		}
		.vc-edit-surface .vc-image-editor--bare .vc-image-editor__badge {
			display: none;
		}
		.vc-edit-surface .vc-image-editor__badge {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			z-index: 2;
			padding: 6px 12px;
			border-radius: 4px;
			background: rgba(147, 51, 234, 0.92);
			color: #fff;
			font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			pointer-events: none;
			opacity: 0;
			transition: opacity 120ms ease;
			white-space: nowrap;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
		}
		.vc-edit-surface [${IMAGE_ATTR}]:hover,
		.vc-edit-surface .vc-image-editor:hover [${IMAGE_ATTR}] {
			outline-color: rgba(147, 51, 234, 0.7);
			box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.08);
		}
		.vc-edit-surface .vc-image-editor:hover .vc-image-editor__badge,
		.vc-edit-surface .vc-image-editor:has(.${IMAGE_SELECTED}) .vc-image-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .${IMAGE_SELECTED} {
			outline: 2px solid #9333ea;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.12);
		}
		.vc-edit-surface .vc-image-editor.${IMAGE_UPDATED} [${IMAGE_ATTR}] {
			outline: 2px solid #00a32a;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(0, 163, 42, 0.15);
		}
		.vc-edit-surface .vc-image-editor.${IMAGE_UPDATED} .vc-image-editor__badge {
			opacity: 1;
			background: rgba(0, 163, 42, 0.95);
		}
		.vc-edit-surface .vc-link-editor {
			position: relative;
			display: inline-block;
			max-width: 100%;
		}
		.vc-edit-surface .vc-link-editor__badge {
			position: absolute;
			right: -4px;
			top: -10px;
			z-index: 2;
			padding: 2px 8px;
			border: none;
			border-radius: 4px;
			background: rgba(217, 119, 6, 0.95);
			color: #fff;
			font: 600 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			cursor: pointer;
			opacity: 0;
			transition: opacity 120ms ease, background-color 120ms ease;
			white-space: nowrap;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
		}
		.vc-edit-surface .vc-link-editor:hover .vc-link-editor__badge,
		.vc-edit-surface .vc-link-editor:has(.${LINK_SELECTED}) .vc-link-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .vc-link-editor [${LINK_ATTR}] {
			transition: outline-color 120ms ease, box-shadow 120ms ease;
		}
		.vc-edit-surface .vc-link-editor:hover [${LINK_ATTR}],
		.vc-edit-surface .${LINK_SELECTED} {
			outline: 2px solid #d97706;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.12);
		}
		.vc-edit-surface .vc-link-editor.${LINK_UPDATED} .vc-link-editor__badge {
			opacity: 1;
			background: rgba(0, 163, 42, 0.95);
		}
		.vc-edit-surface .${BG_EDITOR} {
			position: relative;
		}
		.vc-edit-surface .vc-bg-editor__badge {
			position: absolute;
			top: 12px;
			right: 12px;
			z-index: 5;
			padding: 6px 12px;
			border: none;
			border-radius: 4px;
			background: rgba(37, 99, 235, 0.95);
			color: #fff;
			font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			cursor: pointer;
			opacity: 0;
			transition: opacity 120ms ease, background-color 120ms ease;
			white-space: nowrap;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
		}
		.vc-edit-surface .${BG_EDITOR}:hover .vc-bg-editor__badge,
		.vc-edit-surface .${BG_EDITOR}.${BG_SELECTED} .vc-bg-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .${BG_EDITOR}:hover,
		.vc-edit-surface .${BG_EDITOR}.${BG_SELECTED} {
			outline: 2px solid #2563eb;
			outline-offset: -2px;
			box-shadow: inset 0 0 0 4px rgba(37, 99, 235, 0.15);
		}
		.vc-edit-surface .${BG_EDITOR}.${BG_UPDATED} .vc-bg-editor__badge {
			opacity: 1;
			background: rgba(0, 163, 42, 0.95);
		}
		.vc-format-bar {
			position: absolute;
			z-index: 1000;
			display: flex;
			align-items: center;
			padding: 2px;
			background: #fff;
			border-radius: 2px;
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.12);
			font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		.vc-format-bar button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			padding: 0;
			border: 0;
			border-radius: 2px;
			background: transparent;
			color: #1e1e1e;
			cursor: pointer;
			font: inherit;
		}
		.vc-format-bar button:hover {
			background: #f0f0f0;
		}
		.vc-format-bar button:focus {
			outline: 1.5px solid #3858e9;
			outline-offset: -1.5px;
		}
		.vc-format-bar button[hidden] {
			display: none;
		}
		.vc-format-bar__link {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 2px 4px;
		}
		.vc-format-bar__link[hidden] {
			display: none;
		}
		.vc-format-bar__link input {
			height: 32px;
			min-width: 210px;
			padding: 0 8px;
			color: #1e1e1e;
			border: 1px solid #949494;
			border-radius: 2px;
			font: 400 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		.vc-format-bar__link input:focus {
			border-color: #3858e9;
			box-shadow: 0 0 0 1px #3858e9;
			outline: none;
		}
		.vc-format-bar button.vc-format-bar__apply {
			width: auto;
			height: 32px;
			padding: 0 12px;
			background: #3858e9;
			color: #fff;
			font: 600 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		.vc-format-bar button.vc-format-bar__apply:hover {
			background: #2a3fc0;
		}
	`;
  }
  function VisualEditor({ content, setContent }) {
    const containerRef = (0, import_element.useRef)(null);
    const lastHtmlRef = (0, import_element.useRef)(null);
    const selectedImageRef = (0, import_element.useRef)(null);
    const selectedLinkRef = (0, import_element.useRef)(null);
    const selectedBgRef = (0, import_element.useRef)(null);
    const suppressBlurRef = (0, import_element.useRef)(false);
    const [imageModalOpen, setImageModalOpen] = (0, import_element.useState)(false);
    const [linkModalOpen, setLinkModalOpen] = (0, import_element.useState)(false);
    const [bgModalOpen, setBgModalOpen] = (0, import_element.useState)(false);
    const [imageData, setImageData] = (0, import_element.useState)({ src: "", alt: "" });
    const [linkData, setLinkData] = (0, import_element.useState)({
      href: "",
      text: "",
      newTab: false
    });
    const [bgData, setBgData] = (0, import_element.useState)({ url: "" });
    const feedbackTimerRef = (0, import_element.useRef)(null);
    const syncContent = (0, import_element.useCallback)(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const clone = container.ownerDocument.createElement("div");
      clone.innerHTML = container.innerHTML;
      clone.querySelectorAll("[" + IMAGE_WRAP_ATTR + "]").forEach((wrap) => {
        const img = wrap.querySelector("img");
        if (img && wrap.parentNode) {
          wrap.parentNode.insertBefore(img, wrap);
          wrap.remove();
        }
      });
      clone.querySelectorAll("[" + LINK_WRAP_ATTR + "]").forEach((wrap) => {
        const anchor = wrap.querySelector("a");
        if (anchor && wrap.parentNode) {
          wrap.parentNode.insertBefore(anchor, wrap);
          wrap.remove();
        }
      });
      clone.querySelectorAll(
        "[contenteditable], [" + EDITABLE_ATTR + "], [" + IMAGE_ATTR + "], [" + LINK_ATTR + "], [spellcheck], ." + IMAGE_SELECTED + ", ." + LINK_SELECTED + ", .vc-image-editor__badge, .vc-link-editor__badge"
      ).forEach((element) => {
        element.removeAttribute("contenteditable");
        element.removeAttribute(EDITABLE_ATTR);
        element.removeAttribute(IMAGE_ATTR);
        element.removeAttribute(LINK_ATTR);
        element.removeAttribute("spellcheck");
        element.classList.remove(IMAGE_SELECTED);
        element.classList.remove(LINK_SELECTED);
      });
      clone.querySelectorAll(
        ".vc-image-editor__badge, .vc-link-editor__badge, .vc-bg-editor__badge"
      ).forEach((element) => element.remove());
      clone.querySelectorAll("." + BG_EDITOR).forEach((element) => {
        element.classList.remove(BG_EDITOR, BG_SELECTED, BG_UPDATED);
        element.removeAttribute(BG_STYLE_INDEX_ATTR);
        element.removeAttribute(BG_SELECTOR_ATTR);
      });
      const cloneDoc = clone.ownerDocument;
      clone.querySelectorAll("b").forEach((el) => {
        const strong = cloneDoc.createElement("strong");
        strong.innerHTML = el.innerHTML;
        el.replaceWith(strong);
      });
      clone.querySelectorAll("i").forEach((el) => {
        const em = cloneDoc.createElement("em");
        em.innerHTML = el.innerHTML;
        el.replaceWith(em);
      });
      clone.querySelectorAll("strong, em, a").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img")) {
          el.replaceWith(...el.childNodes);
        }
      });
      const html = clone.innerHTML;
      if (html !== lastHtmlRef.current) {
        lastHtmlRef.current = html;
        setContent(html);
      }
    }, [setContent]);
    const syncContentRef = (0, import_element.useRef)(syncContent);
    syncContentRef.current = syncContent;
    const closeImageModal = (0, import_element.useCallback)(() => {
      const img = selectedImageRef.current;
      if (img) {
        img.classList.remove(IMAGE_SELECTED);
      }
      selectedImageRef.current = null;
      setImageModalOpen(false);
    }, []);
    const closeLinkModal = (0, import_element.useCallback)(() => {
      const anchor = selectedLinkRef.current;
      if (anchor) {
        anchor.classList.remove(LINK_SELECTED);
      }
      selectedLinkRef.current = null;
      setLinkModalOpen(false);
    }, []);
    const closeBgModal = (0, import_element.useCallback)(() => {
      const element = selectedBgRef.current;
      if (element) {
        element.classList.remove(BG_SELECTED);
      }
      selectedBgRef.current = null;
      setBgModalOpen(false);
    }, []);
    const updateSelectedImage = (0, import_element.useCallback)((changes) => {
      const img = selectedImageRef.current;
      if (img) {
        applyImageToElement(img, changes);
        setImageData(readImage(img));
        syncContentRef.current();
      }
    }, []);
    const updateSelectedLink = (0, import_element.useCallback)((changes) => {
      const anchor = selectedLinkRef.current;
      if (anchor) {
        applyLinkToElement(anchor, changes);
        setLinkData(readLink(anchor));
        syncContentRef.current();
      }
    }, []);
    const updateSelectedBg = (0, import_element.useCallback)((changes) => {
      const element = selectedBgRef.current;
      const root = containerRef.current;
      if (element) {
        applyBgToElement(element, root, changes);
        setBgData(readElementBgUrl(element, root));
        syncContentRef.current();
      }
    }, []);
    const selectBg = (0, import_element.useCallback)((element) => {
      if (selectedBgRef.current && selectedBgRef.current !== element) {
        selectedBgRef.current.classList.remove(BG_SELECTED);
      }
      selectedBgRef.current = element;
      element.classList.add(BG_SELECTED);
      setBgData(readElementBgUrl(element, containerRef.current));
      setBgModalOpen(true);
    }, []);
    const flashBgUpdated = (0, import_element.useCallback)((element) => {
      element.classList.add(BG_UPDATED);
      const badge = element.querySelector(".vc-bg-editor__badge");
      if (badge) {
        badge.textContent = (0, import_i18n.__)(
          "Background updated",
          "jamies-visual-html-editor"
        );
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        element.classList.remove(BG_UPDATED);
        if (badge) {
          badge.textContent = (0, import_i18n.__)(
            "Edit background",
            "jamies-visual-html-editor"
          );
        }
        feedbackTimerRef.current = null;
      }, FEEDBACK_DELAY);
    }, []);
    const selectLink = (0, import_element.useCallback)((anchor) => {
      if (selectedLinkRef.current && selectedLinkRef.current !== anchor) {
        selectedLinkRef.current.classList.remove(LINK_SELECTED);
      }
      selectedLinkRef.current = anchor;
      anchor.classList.add(LINK_SELECTED);
      setLinkData(readLink(anchor));
      setLinkModalOpen(true);
    }, []);
    const flashLinkUpdated = (0, import_element.useCallback)((anchor) => {
      const wrap = anchor.closest("[" + LINK_WRAP_ATTR + "]");
      if (!wrap) {
        return;
      }
      const badge = wrap.querySelector(".vc-link-editor__badge");
      wrap.classList.add(LINK_UPDATED);
      if (badge) {
        badge.textContent = (0, import_i18n.__)(
          "Link updated",
          "jamies-visual-html-editor"
        );
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        wrap.classList.remove(LINK_UPDATED);
        if (badge) {
          badge.textContent = (0, import_i18n.__)(
            "Edit link",
            "jamies-visual-html-editor"
          );
        }
        feedbackTimerRef.current = null;
      }, FEEDBACK_DELAY);
    }, []);
    const selectImage = (0, import_element.useCallback)((img) => {
      if (selectedImageRef.current && selectedImageRef.current !== img) {
        selectedImageRef.current.classList.remove(IMAGE_SELECTED);
      }
      selectedImageRef.current = img;
      img.classList.add(IMAGE_SELECTED);
      setImageData(readImage(img));
      setImageModalOpen(true);
    }, []);
    const flashImageUpdated = (0, import_element.useCallback)((img) => {
      const wrap = img.closest("[" + IMAGE_WRAP_ATTR + "]");
      if (!wrap) {
        return;
      }
      const badge = wrap.querySelector(".vc-image-editor__badge");
      wrap.classList.add(IMAGE_UPDATED);
      if (badge) {
        badge.textContent = (0, import_i18n.__)(
          "Image updated",
          "jamies-visual-html-editor"
        );
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        wrap.classList.remove(IMAGE_UPDATED);
        if (badge) {
          badge.textContent = (0, import_i18n.__)(
            "Edit image",
            "jamies-visual-html-editor"
          );
        }
        feedbackTimerRef.current = null;
      }, FEEDBACK_DELAY);
    }, []);
    (0, import_element.useEffect)(
      () => () => {
        if (feedbackTimerRef.current) {
          window.clearTimeout(feedbackTimerRef.current);
        }
      },
      []
    );
    (0, import_element.useEffect)(() => {
      const container = containerRef.current;
      if (!container || content === lastHtmlRef.current) {
        return;
      }
      closeImageModal();
      closeLinkModal();
      closeBgModal();
      container.innerHTML = content || "";
      lastHtmlRef.current = content;
      decorateText(container);
      decorateImages(container);
      decorateLinks(container);
      decorateBackgrounds(container);
      injectEditStyles(container.ownerDocument);
    }, [content, closeImageModal, closeLinkModal, closeBgModal]);
    (0, import_element.useEffect)(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const onMouseDown = (event) => {
        const bgBadge = event.target.closest(".vc-bg-editor__badge");
        if (bgBadge) {
          const bgEl = bgBadge.closest("." + BG_EDITOR);
          if (bgEl && bgEl.classList.contains(BG_EDITOR) && container.contains(bgEl) && !bgEl.closest("svg")) {
            event.preventDefault();
            event.stopPropagation();
            suppressBlurRef.current = true;
            selectBg(bgEl);
          }
          return;
        }
        const linkBadge = event.target.closest(
          ".vc-link-editor__badge"
        );
        if (linkBadge) {
          const wrap = linkBadge.closest("[" + LINK_WRAP_ATTR + "]");
          const anchor = wrap?.querySelector("a[" + LINK_ATTR + "]");
          if (anchor && container.contains(anchor) && !anchor.closest("svg")) {
            event.preventDefault();
            event.stopPropagation();
            suppressBlurRef.current = true;
            selectLink(anchor);
          }
          return;
        }
        const imgWrap = event.target.closest(
          "[" + IMAGE_WRAP_ATTR + "]"
        );
        const img = event.target.closest("img") || (imgWrap ? imgWrap.querySelector("img") : null);
        if (img && container.contains(img) && !img.closest("svg") && img.hasAttribute(IMAGE_ATTR)) {
          event.preventDefault();
          event.stopPropagation();
          suppressBlurRef.current = true;
          selectImage(img);
        }
      };
      container.addEventListener("mousedown", onMouseDown, true);
      return () => container.removeEventListener("mousedown", onMouseDown, true);
    }, [selectImage, selectLink, selectBg]);
    (0, import_element.useEffect)(() => {
      const container = containerRef.current;
      if (!container) {
        return void 0;
      }
      const doc = container.ownerDocument;
      const win = doc.defaultView || window;
      try {
        doc.execCommand("styleWithCSS", false, false);
      } catch (e) {
      }
      const bar = doc.createElement("div");
      bar.className = "vc-format-bar";
      bar.setAttribute("contenteditable", "false");
      bar.style.display = "none";
      const svgIcon = (path) => '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="' + path + '"></path></svg>';
      const ICON_BOLD = "M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z";
      const ICON_ITALIC = "M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z";
      const ICON_LINK = "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z";
      const ICON_CLOSE = "M13.06 12l6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06z";
      bar.innerHTML = '<button type="button" data-cmd="bold" aria-label="' + (0, import_i18n.__)("Bold", "jamies-visual-html-editor") + '">' + svgIcon(ICON_BOLD) + '</button><button type="button" data-cmd="italic" aria-label="' + (0, import_i18n.__)("Italic", "jamies-visual-html-editor") + '">' + svgIcon(ICON_ITALIC) + '</button><button type="button" data-cmd="link" aria-label="' + (0, import_i18n.__)("Add link", "jamies-visual-html-editor") + '">' + svgIcon(ICON_LINK) + '</button><span class="vc-format-bar__link" hidden><input type="url" placeholder="https://example.com" /><button type="button" class="vc-format-bar__apply" data-cmd="apply-link">' + (0, import_i18n.__)("Add", "jamies-visual-html-editor") + '</button><button type="button" data-cmd="cancel-link" aria-label="' + (0, import_i18n.__)("Cancel", "jamies-visual-html-editor") + '">' + svgIcon(ICON_CLOSE) + "</button></span>";
      doc.body.appendChild(bar);
      const linkWrap = bar.querySelector(".vc-format-bar__link");
      const linkInput = linkWrap.querySelector("input");
      const mainBtns = bar.querySelectorAll(
        'button[data-cmd="bold"],button[data-cmd="italic"],button[data-cmd="link"]'
      );
      let savedRange = null;
      const inLinkMode = () => !linkWrap.hasAttribute("hidden");
      const currentSelection = () => {
        const sel = doc.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          return null;
        }
        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;
        if (node.nodeType === 3) {
          node = node.parentElement;
        }
        if (!node || !container.contains(node)) {
          return null;
        }
        if (!node.closest("[" + EDITABLE_ATTR + "]")) {
          return null;
        }
        return range;
      };
      const showMainButtons = () => {
        linkWrap.setAttribute("hidden", "");
        mainBtns.forEach((b) => b.removeAttribute("hidden"));
      };
      const hideBar = () => {
        bar.style.display = "none";
        showMainButtons();
      };
      const positionBar = (range) => {
        const rect = range.getBoundingClientRect();
        if (!rect || rect.width === 0 && rect.height === 0) {
          return;
        }
        bar.style.display = "flex";
        const top = rect.top + win.scrollY - bar.offsetHeight - 8;
        const left = rect.left + win.scrollX;
        bar.style.top = Math.max(0, top) + "px";
        bar.style.left = Math.max(0, left) + "px";
      };
      const updateBar = () => {
        if (inLinkMode()) {
          return;
        }
        const range = currentSelection();
        if (!range) {
          hideBar();
          return;
        }
        positionBar(range);
      };
      const onSelectionChange = () => updateBar();
      doc.addEventListener("selectionchange", onSelectionChange);
      const onBarMouseDown = (event) => {
        if (event.target.tagName !== "INPUT") {
          event.preventDefault();
        }
      };
      bar.addEventListener("mousedown", onBarMouseDown);
      const onBarClick = (event) => {
        const btn = event.target.closest("button");
        if (!btn) {
          return;
        }
        const cmd = btn.getAttribute("data-cmd");
        if (cmd === "bold" || cmd === "italic") {
          doc.execCommand(cmd, false, null);
          syncContentRef.current();
          updateBar();
        } else if (cmd === "link") {
          const range = currentSelection();
          if (!range) {
            return;
          }
          savedRange = range.cloneRange();
          mainBtns.forEach((b) => b.setAttribute("hidden", ""));
          linkWrap.removeAttribute("hidden");
          linkInput.value = "";
          linkInput.focus();
        } else if (cmd === "apply-link") {
          const url = (linkInput.value || "").trim();
          if (url && savedRange) {
            const sel = doc.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            doc.execCommand("createLink", false, url);
            syncContentRef.current();
          }
          savedRange = null;
          hideBar();
        } else if (cmd === "cancel-link") {
          savedRange = null;
          hideBar();
        }
      };
      bar.addEventListener("click", onBarClick);
      const onLinkKeyDown = (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          bar.querySelector('button[data-cmd="apply-link"]').click();
        } else if (event.key === "Escape") {
          event.preventDefault();
          savedRange = null;
          hideBar();
        }
      };
      linkInput.addEventListener("keydown", onLinkKeyDown);
      return () => {
        doc.removeEventListener("selectionchange", onSelectionChange);
        bar.removeEventListener("mousedown", onBarMouseDown);
        bar.removeEventListener("click", onBarClick);
        linkInput.removeEventListener("keydown", onLinkKeyDown);
        bar.remove();
      };
    }, []);
    const handleImageMediaSelect = (0, import_element.useCallback)(
      (media) => {
        const img = selectedImageRef.current;
        if (img) {
          updateSelectedImage({
            src: media.url,
            alt: media.alt || imageData.alt
          });
          closeImageModal();
          flashImageUpdated(img);
        }
      },
      [updateSelectedImage, imageData.alt, closeImageModal, flashImageUpdated]
    );
    const handleBgMediaSelect = (0, import_element.useCallback)(
      (media) => {
        const element = selectedBgRef.current;
        if (element) {
          updateSelectedBg({ url: media.url });
          closeBgModal();
          flashBgUpdated(element);
        }
      },
      [updateSelectedBg, closeBgModal, flashBgUpdated]
    );
    const handleBgDone = (0, import_element.useCallback)(() => {
      const element = selectedBgRef.current;
      if (element) {
        flashBgUpdated(element);
      }
      closeBgModal();
    }, [closeBgModal, flashBgUpdated]);
    const handleLinkDone = (0, import_element.useCallback)(() => {
      const anchor = selectedLinkRef.current;
      if (anchor) {
        flashLinkUpdated(anchor);
      }
      closeLinkModal();
    }, [closeLinkModal, flashLinkUpdated]);
    return /* @__PURE__ */ window.wp.element.createElement(import_element.Fragment, null, /* @__PURE__ */ window.wp.element.createElement(
      "div",
      {
        ref: containerRef,
        className: "vc-edit-surface",
        onBlur: () => {
          if (suppressBlurRef.current) {
            suppressBlurRef.current = false;
          } else {
            syncContent();
          }
        },
        onPaste: (event) => {
          const target = event.target;
          if (!target || !target.closest("[" + EDITABLE_ATTR + "]")) {
            return;
          }
          event.preventDefault();
          const text = (event.clipboardData || window.clipboardData).getData("text");
          target.ownerDocument.execCommand(
            "insertText",
            false,
            text
          );
        },
        onKeyDown: (event) => {
          const target = event.target;
          if (target && target.closest && target.closest("[" + EDITABLE_ATTR + "]")) {
            event.stopPropagation();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              target.blur();
            }
          }
        }
      }
    ), imageModalOpen && /* @__PURE__ */ window.wp.element.createElement(
      import_components.Modal,
      {
        title: (0, import_i18n.__)("Edit image", "jamies-visual-html-editor"),
        onRequestClose: closeImageModal,
        className: "vc-image-modal"
      },
      /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__fields" }, imageData.src && /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-image-modal__preview" }, /* @__PURE__ */ window.wp.element.createElement("img", { src: imageData.src, alt: imageData.alt })), /* @__PURE__ */ window.wp.element.createElement(import_block_editor.MediaUploadCheck, null, /* @__PURE__ */ window.wp.element.createElement(
        import_media_utils.MediaUpload,
        {
          allowedTypes: ["image"],
          value: imageData.src ? { url: imageData.src } : void 0,
          onSelect: handleImageMediaSelect,
          render: ({ open }) => /* @__PURE__ */ window.wp.element.createElement(import_components.Button, { variant: "primary", onClick: open }, (0, import_i18n.__)(
            "Replace from Media Library",
            "jamies-visual-html-editor"
          ))
        }
      )), /* @__PURE__ */ window.wp.element.createElement(
        import_components.TextControl,
        {
          label: (0, import_i18n.__)(
            "Image URL",
            "jamies-visual-html-editor"
          ),
          value: imageData.src,
          onChange: (value) => updateSelectedImage({ src: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement(
        import_components.TextControl,
        {
          label: (0, import_i18n.__)(
            "Alt text",
            "jamies-visual-html-editor"
          ),
          value: imageData.alt,
          onChange: (value) => updateSelectedImage({ alt: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__actions" }, /* @__PURE__ */ window.wp.element.createElement(
        import_components.Button,
        {
          variant: "primary",
          onClick: closeImageModal
        },
        (0, import_i18n.__)("Done", "jamies-visual-html-editor")
      )))
    ), linkModalOpen && /* @__PURE__ */ window.wp.element.createElement(
      import_components.Modal,
      {
        title: (0, import_i18n.__)("Edit link", "jamies-visual-html-editor"),
        onRequestClose: closeLinkModal,
        className: "vc-link-modal"
      },
      /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__fields" }, /* @__PURE__ */ window.wp.element.createElement(
        import_components.TextControl,
        {
          label: (0, import_i18n.__)(
            "Link URL",
            "jamies-visual-html-editor"
          ),
          value: linkData.href,
          onChange: (value) => updateSelectedLink({ href: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement(
        import_components.TextControl,
        {
          label: (0, import_i18n.__)(
            "Link text",
            "jamies-visual-html-editor"
          ),
          value: linkData.text,
          onChange: (value) => updateSelectedLink({ text: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement(
        import_components.CheckboxControl,
        {
          label: (0, import_i18n.__)(
            "Open in new tab",
            "jamies-visual-html-editor"
          ),
          checked: linkData.newTab,
          onChange: (value) => updateSelectedLink({ newTab: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__actions" }, /* @__PURE__ */ window.wp.element.createElement(import_components.Button, { variant: "primary", onClick: handleLinkDone }, (0, import_i18n.__)("Done", "jamies-visual-html-editor"))))
    ), bgModalOpen && /* @__PURE__ */ window.wp.element.createElement(
      import_components.Modal,
      {
        title: (0, import_i18n.__)(
          "Edit background",
          "jamies-visual-html-editor"
        ),
        onRequestClose: closeBgModal,
        className: "vc-bg-modal"
      },
      /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__fields" }, bgData.url && /* @__PURE__ */ window.wp.element.createElement(
        "div",
        {
          className: "vc-bg-modal__preview",
          style: {
            backgroundImage: 'url("' + bgData.url + '")'
          }
        }
      ), /* @__PURE__ */ window.wp.element.createElement(import_block_editor.MediaUploadCheck, null, /* @__PURE__ */ window.wp.element.createElement(
        import_media_utils.MediaUpload,
        {
          allowedTypes: ["image"],
          onSelect: handleBgMediaSelect,
          render: ({ open }) => /* @__PURE__ */ window.wp.element.createElement(import_components.Button, { variant: "primary", onClick: open }, (0, import_i18n.__)(
            "Replace from Media Library",
            "jamies-visual-html-editor"
          ))
        }
      )), /* @__PURE__ */ window.wp.element.createElement(
        import_components.TextControl,
        {
          label: (0, import_i18n.__)(
            "Background image URL",
            "jamies-visual-html-editor"
          ),
          value: bgData.url,
          onChange: (value) => updateSelectedBg({ url: value })
        }
      ), /* @__PURE__ */ window.wp.element.createElement("div", { className: "vc-edit-modal__actions" }, /* @__PURE__ */ window.wp.element.createElement(import_components.Button, { variant: "primary", onClick: handleBgDone }, (0, import_i18n.__)("Done", "jamies-visual-html-editor"))))
    ));
  }
  function EditHtmlBlock({ attributes, setAttributes, clientId, isSelected }) {
    const savedMarkup = (0, import_data.useSelect)(
      (select) => {
        const block = select("core/block-editor").getBlock(clientId);
        return block?.originalContent || "";
      },
      [clientId]
    );
    const attrContent = attributes.content || "";
    const content = attrContent.trim() ? attrContent : savedMarkup;
    const { replaceBlock } = (0, import_data.useDispatch)("core/block-editor");
    const rebuiltRef = (0, import_element.useRef)(false);
    (0, import_element.useEffect)(() => {
      if (!rebuiltRef.current && isSelected && !attrContent.trim() && savedMarkup.trim()) {
        rebuiltRef.current = true;
        replaceBlock(
          clientId,
          (0, import_blocks.createBlock)("core/html", {
            ...attributes,
            content: savedMarkup
          })
        );
      }
    }, [
      isSelected,
      savedMarkup,
      attrContent,
      attributes,
      clientId,
      replaceBlock
    ]);
    const [mode, setMode] = (0, import_element.useState)(
      () => content && content.trim() ? "text" : "code"
    );
    const blockProps = (0, import_block_editor.useBlockProps)({ className: "vc-html-edit" });
    const setContent = (next) => setAttributes({ content: next });
    return /* @__PURE__ */ window.wp.element.createElement(import_element.Fragment, null, /* @__PURE__ */ window.wp.element.createElement(import_block_editor.BlockControls, null, /* @__PURE__ */ window.wp.element.createElement(import_components.ToolbarGroup, null, /* @__PURE__ */ window.wp.element.createElement(
      import_components.ToolbarButton,
      {
        isPressed: mode === "text",
        onClick: () => setMode("text")
      },
      (0, import_i18n.__)("Edit content", "jamies-visual-html-editor")
    ), /* @__PURE__ */ window.wp.element.createElement(
      import_components.ToolbarButton,
      {
        isPressed: mode === "code",
        onClick: () => setMode("code")
      },
      (0, import_i18n.__)("Edit code", "jamies-visual-html-editor")
    ))), /* @__PURE__ */ window.wp.element.createElement(import_block_editor.BlockControls, { group: "block" }, /* @__PURE__ */ window.wp.element.createElement(
      import_block_editor.BlockAlignmentControl,
      {
        value: attributes.align,
        onChange: (align) => setAttributes({ align }),
        controls: ["wide", "full"]
      }
    )), /* @__PURE__ */ window.wp.element.createElement("div", { ...blockProps }, mode === "text" ? /* @__PURE__ */ window.wp.element.createElement(
      VisualEditor,
      {
        content,
        setContent
      }
    ) : /* @__PURE__ */ window.wp.element.createElement(
      import_block_editor.PlainText,
      {
        value: content,
        onChange: setContent,
        className: "vc-html-edit__code",
        placeholder: (0, import_i18n.__)(
          "Paste or write HTML here, then switch to \u201CEdit content\u201D.",
          "jamies-visual-html-editor"
        ),
        "aria-label": (0, import_i18n.__)(
          "Custom HTML",
          "jamies-visual-html-editor"
        )
      }
    )));
  }
  (0, import_hooks.addFilter)(
    "editor.BlockEdit",
    "jamies-visual-html-editor/html-text-edit",
    (0, import_compose.createHigherOrderComponent)(
      (BlockEdit) => (props) => props.name === "core/html" ? /* @__PURE__ */ window.wp.element.createElement(EditHtmlBlock, { ...props }) : /* @__PURE__ */ window.wp.element.createElement(BlockEdit, { ...props }),
      "withHtmlTextEdit"
    )
  );
  (0, import_hooks.addFilter)(
    "blocks.registerBlockType",
    "jamies-visual-html-editor/html-align-support",
    (settings, name) => {
      if (name !== "core/html") {
        return settings;
      }
      return {
        ...settings,
        supports: {
          ...settings.supports,
          align: ["wide", "full"]
        },
        attributes: {
          ...settings.attributes,
          align: { type: "string" }
        },
        /*
         * On some builds core/html's own save() returns null and its
         * `content` is a non-persisted "local" attribute, so a block whose
         * content is edited (rather than kept verbatim from the originally
         * parsed markup) serialises to an empty `<!-- wp:html /-->` and the
         * edit is lost. Emitting the content ourselves as raw HTML — the
         * exact same markup core/html has always saved between its comment
         * delimiters — makes edited blocks persist. Untouched blocks are
         * unaffected: they keep their original markup via the editor's
         * originalContent fallback. (Paired with rebuilding a parsed block
         * as a fresh one on first edit, in EditHtmlBlock, so the editor
         * serialises from this save() instead of the retained markup.)
         */
        save: ({ attributes }) => {
          const html = attributes && attributes.content ? attributes.content : "";
          return html ? /* @__PURE__ */ window.wp.element.createElement(import_element.RawHTML, null, html) : null;
        }
      };
    }
  );
})();
