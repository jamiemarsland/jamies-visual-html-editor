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

## Testing

The regression suite lives in `tests/vhe-tests.js` — one file, plain JavaScript, no framework. It runs **inside the real block editor** on a dedicated fixture page, exercising the plugin exactly as a user would, and draws a results panel top-left. It covers the things that have actually broken: edits saving to the database, ancestor-sized images rendering, the format bubble producing clean markup, saved blocks opening with content, and nothing dirtying a post just by opening it.

**Run it.** With the plugin active on any WordPress you're logged into as an editor (a local Studio site, a Playground, a test install), open:

```
/wp-admin/?vhe-test=1&vhecb=1
```

That creates (or resets) a draft page called "VHE Test Fixture", opens it in the editor with the suite loaded, and runs ~19 tests in a few seconds. Bump `vhecb` to a new number each run to beat caching. Failures are listed in the panel with the reason.

**Read a run** from the browser console (or a script):

```js
var p = window.__vheTestProgress || [], r = window.__vheTestResults;
({ n: p.length, done: !!r, fails: p.filter(t => !t.pass).map(t => t.name + ' :: ' + t.detail) })
```

`__vheTestProgress` grows test by test (so a stuck run shows where it stopped); `__vheTestResults` appears when the run is done.

**The suite never writes anywhere but the fixture page.** It wraps `window.fetch` and refuses every non-GET REST call not aimed at the fixture page, listing anything refused on `window.__vheTestBlockedWrites` (which the last test asserts is empty). The fixture page is reset from `tests/fixture.html` on every visit, so it's always throwaway — never put real content on it.

**Writing a test:** `test( 'name', fn )` or `testAsync( 'name', async fn )`; `expect( cond, 'message' )` records a failure and keeps going. Helpers: `q()` queries the editor canvas, `surface()` is the live Edit content area, `htmlBlock()` / `selectHtmlBlock()` find the block, `setText()` edits and syncs, `selectAllTextIn()` raises the format bubble, `savePost()` / `storedRaw()` save and read the database. Keep a test's awaits to two or fewer, and note the plugin rebuilds a saved block on first selection (its clientId changes — always re-find it).

**A note on the Claude desktop Browser pane:** the tab reports `document.hidden === true` there, so timers are throttled and CSS transitions don't advance. The hover/transition-sensitive checks may lag; if anything fails only in the pane, re-run in your own Chrome — that's the arbiter.

**Test mode is dev-only.** `tests/` is excluded from the release zip (`.pressshipignore`), and without those files the `?vhe-test=1` flag does nothing.

### Release walk

1. `node --check tests/vhe-tests.js` (or `npm run check`), and `npm run build` for the real compiled JS.
2. Bump the version in `jamies-visual-html-editor.php` (header **and** `JVHE_VERSION`) and `readme.txt` (**Stable tag**), and add a changelog + upgrade-notice entry.
3. Run the suite (`/wp-admin/?vhe-test=1&vhecb=N`). Any failure is fixed before release, not noted.
4. Commit and push.
5. `npx pressship verify`, then `npx pressship release`.

## Requirements

- WordPress 6.4+
- PHP 7.4+

## License

[GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html) © Jamie Marsland
