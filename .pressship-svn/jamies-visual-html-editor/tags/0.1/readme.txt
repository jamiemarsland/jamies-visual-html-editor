=== Jamie's Visual HTML Editor ===
Contributors: jamiemarsland
Tags: custom html, inline editing, block editor, full width, images
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Edit text, images, links and backgrounds directly in the WordPress Custom HTML block, and give it Wide and Full width alignment.

== Description ==

Jamie's Visual HTML Editor enhances the core Custom HTML block so you can paste in any HTML and let editors change the copy and images without touching the markup.

* **Edit content** — render the HTML live and click any heading, paragraph, list item, link, or button to edit its text in place. Click any `<img>` to replace it from the Media Library, change its URL, or edit its alt text. Add `data-vc-bg` and an inline `background-image` on hero sections to make backgrounds editable too.
* **Edit code** — the normal raw-HTML view for pasting or writing markup.
* **Wide and Full width** — adds Wide and Full alignment to the Custom HTML block so full-bleed sections can break out of the theme's content width.

Content is stored as a native Custom HTML block, so revisions and saving work exactly as they do in core. The plugin only changes how the block is edited and aligned.

This plugin is open source. See the Development section below for the full human-readable source code and build instructions.

== Installation ==

1. Upload the `jamies-visual-html-editor` folder to the `/wp-content/plugins/` directory, or install the plugin through the Plugins screen in WordPress.
2. Activate the plugin through the Plugins screen.
3. Add or select a Custom HTML block in the block editor and use the "Edit content" / "Edit code" toolbar buttons. Use the alignment control for Wide or Full width.

== Frequently Asked Questions ==

= Which blocks does this affect? =

It enhances the core Custom HTML block (`core/html`). Other blocks are unchanged.

= Will it change my saved HTML? =

The block is still stored as a standard Custom HTML block. Editing text updates the words; editing an image updates its `src` and `alt` attributes. Structure, classes, and styles stay unchanged. Switch to "Edit code" to see the raw markup.

= Can I replace images? =

Yes. In "Edit content" mode, click an image to open a modal where you can choose a replacement from the Media Library, paste an external URL, or edit the alt text.

= Can I replace hero background images? =

Yes. In "Edit content" mode, hover a hero section whose background is set inline or in a `<style>` block inside the HTML, then click **Edit background**. You can also tag any element with `data-vc-bg` and an inline `background-image`. Gradients layered with a photo are supported — only the photo URL is swapped.

= Why isn't my section full width? =

Set the block's alignment to Full width using the block toolbar. The block must be a direct child of the content area for the theme's layout to break it out.

== Screenshots ==

1. The block toolbar in "Edit content" mode — click any text or image to edit it in place.
2. Clicking an image opens the replace modal: choose from the Media Library, paste a URL, or update alt text.
3. Wide and Full width alignment options in the block toolbar for full-bleed sections.

== Development ==

This plugin is open source (GPL-2.0-or-later). The complete, human-readable source code — including the un-minified JavaScript in `src/` and the build configuration — is publicly available at:

https://github.com/jamiemarsland/jamies-visual-html-editor

The compiled files in `build/` are generated with [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts):

`npm install`
`npm run build`

No third-party libraries are bundled; the plugin relies only on the WordPress-provided editor packages (`@wordpress/*`).

== Upgrade Notice ==

= 0.1 =
Initial release.

== Changelog ==

= 0.1 =
* Initial release.
* Custom HTML block: click-to-edit text, plus image, link, and background editing with an "Edit content" / "Edit code" toggle.
* Custom HTML block: Wide and Full width alignment support, applied on the front end.
