# Jamie's Visual HTML Editor

A WordPress plugin that enhances the core **Custom HTML block** so editors can change copy and media without touching the markup.

- **Edit content** — render the HTML live and click any heading, paragraph, list item, link, or button to edit its text in place. Click an image to replace it from the Media Library, change its URL, or edit its alt text. Click a hero background to swap the photo.
- **Edit code** — the normal raw-HTML view for pasting or writing markup.
- **Wide and Full width** — adds Wide and Full alignment to the Custom HTML block.

Content is stored as a native Custom HTML block, so revisions and saving behave exactly as they do in core.

## Source code & build

This repository is the public, maintained source location for the plugin (required by the WordPress.org plugin guidelines).

- Human-readable source lives in [`src/`](src/).
- Compiled output (shipped in the plugin) is generated into [`build/`](build/) with [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts).

```bash
npm install      # install build tools
npm run build    # compile src/ -> build/
npm run start    # watch mode for development
```

No third-party JavaScript libraries are bundled — the plugin uses only the WordPress-provided editor packages (`@wordpress/*`).

## Requirements

- WordPress 6.4+
- PHP 7.4+

## License

[GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html) © Jamie Marsland
