/**
 * Jamie's Visual HTML Editor — in-browser regression suite.
 *
 * Runs inside the real block editor on the dedicated fixture page. Open
 * wp-admin with ?vhe-test=1 (bump &vhecb=N to beat caching) and the suite runs
 * on load, drawing a results panel top-left.
 *
 *   window.__vheTestProgress  — grows test by test (see where a stuck run stopped)
 *   window.__vheTestResults   — { summary, passed, total, results } when done
 *   window.__vheTestBlockedWrites — any write the guard refused (should be [])
 *
 * Read a run from the console / javascript_tool:
 *   var p=window.__vheTestProgress||[], r=window.__vheTestResults;
 *   ({ n:p.length, done:!!r, fails:p.filter(t=>!t.pass).map(t=>t.name+' :: '+t.detail) })
 *
 * THE SUITE NEVER WRITES ANYWHERE BUT THE FIXTURE PAGE. window.fetch is wrapped
 * and every non-GET REST call not aimed at the fixture page is answered locally
 * and logged. Do not bypass it.
 *
 * Plain JavaScript, no framework. test( name, fn ) / testAsync( name, fn );
 * expect( cond, message ) records a failure and keeps going.
 */
( function () {
	'use strict';

	if ( ! window.wp || ! window.VHE_TEST ) {
		return;
	}

	var CFG = window.VHE_TEST;
	var FIXTURE_ID = parseInt( CFG.fixtureId, 10 ) || 0;
	var select = wp.data.select;
	var dispatch = wp.data.dispatch;

	/* ------------------------------------------------------------------ */
	/* Write guard                                                          */
	/* ------------------------------------------------------------------ */

	var blocked = [];
	var ignored = [];
	window.__vheTestBlockedWrites = blocked;
	window.__vheTestIgnoredWrites = ignored;

	var realFetch = window.fetch.bind( window );
	window.fetch = function ( input, init ) {
		var url = typeof input === 'string' ? input : ( input && input.url ) || '';
		var method = ( ( init && init.method ) || ( input && input.method ) || 'GET' ).toUpperCase();

		if ( method !== 'GET' && method !== 'HEAD' && isRestUrl( url ) && ! isFixtureWrite( url ) ) {
			// Known-benign editor housekeeping (the current user's own editor
			// preferences — welcome guide, panel state). Still refused, so the
			// suite writes nothing but the fixture page, but not a failure.
			( isBenignWrite( url ) ? ignored : blocked ).push( method + ' ' + url );
			return Promise.resolve(
				new Response( '{}', { status: 200, headers: { 'Content-Type': 'application/json' } } )
			);
		}
		return realFetch( input, init );
	};

	function isRestUrl( url ) {
		return /\/wp-json\/|[?&]rest_route=/.test( url );
	}

	function isBenignWrite( url ) {
		return /\/wp\/v2\/users\/me(\/|\?|$)/.test( url );
	}

	function isFixtureWrite( url ) {
		if ( ! FIXTURE_ID ) {
			return false;
		}
		// /wp/v2/pages/<id>, /wp/v2/pages/<id>/autosaves, .../revisions
		var re = new RegExp( '/wp/v2/pages/' + FIXTURE_ID + '(/|\\?|$)' );
		return re.test( url );
	}

	/* ------------------------------------------------------------------ */
	/* Harness                                                              */
	/* ------------------------------------------------------------------ */

	var tests = [];
	var progress = [];
	window.__vheTestProgress = progress;
	window.__vheTestResults = null;
	var currentFails = null;

	function test( name, fn ) {
		tests.push( { name: name, fn: fn, async: false } );
	}
	function testAsync( name, fn ) {
		tests.push( { name: name, fn: fn, async: true } );
	}
	function expect( cond, message ) {
		if ( ! cond ) {
			currentFails.push( message || 'expectation failed' );
		}
	}

	var panel;
	function drawPanel() {
		if ( ! panel ) {
			panel = document.createElement( 'div' );
			panel.id = 'vhe-test-panel';
			panel.style.cssText =
				'position:fixed;top:8px;left:8px;z-index:999999;max-width:460px;max-height:80vh;overflow:auto;' +
				'background:#111;color:#eee;font:12px/1.45 ui-monospace,Menlo,monospace;padding:10px 12px;' +
				'border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.4);';
			document.body.appendChild( panel );
		}
		var passed = progress.filter( function ( t ) { return t.pass; } ).length;
		var done = !! window.__vheTestResults;
		var html =
			'<div style="font-weight:700;margin-bottom:6px;">VHE tests ' +
			( done ? '— done' : '— running…' ) +
			' &nbsp; <span style="color:' + ( passed === progress.length ? '#7bd88f' : '#ff7b7b' ) + '">' +
			passed + '/' + progress.length + ( done ? '' : ' of ' + tests.length ) +
			'</span></div>';
		progress.forEach( function ( t ) {
			if ( t.pass ) {
				return;
			}
			html +=
				'<div style="margin:4px 0;color:#ff7b7b;">✗ ' + escapeHtml( t.name ) +
				'<div style="color:#f3c;opacity:.85;white-space:pre-wrap;">' + escapeHtml( t.detail ) + '</div></div>';
		} );
		if ( done && passed === progress.length ) {
			html += '<div style="color:#7bd88f;">All passed.</div>';
		}
		panel.innerHTML = html;
	}
	function escapeHtml( s ) {
		return String( s ).replace( /[&<>]/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ c ];
		} );
	}

	function record( name, fails ) {
		var entry = { name: name, pass: fails.length === 0, detail: fails.join( ' | ' ) };
		progress.push( entry );
		drawPanel();
	}

	function runAll() {
		var i = 0;
		function next() {
			if ( i >= tests.length ) {
				var passed = progress.filter( function ( t ) { return t.pass; } ).length;
				window.__vheTestResults = {
					summary: passed + '/' + progress.length + ' passed',
					passed: passed,
					total: progress.length,
					results: progress.slice(),
					blockedWrites: blocked.slice(),
				};
				drawPanel();
				return;
			}
			var t = tests[ i++ ];
			currentFails = [];
			var finish = function () {
				record( t.name, currentFails );
				setTimeout( next, 0 );
			};
			try {
				var r = t.fn();
				if ( t.async && r && typeof r.then === 'function' ) {
					r.then( finish, function ( err ) {
						currentFails.push( 'threw: ' + ( err && err.message ? err.message : err ) );
						finish();
					} );
				} else {
					finish();
				}
			} catch ( err ) {
				currentFails.push( 'threw: ' + ( err && err.message ? err.message : err ) );
				finish();
			}
		}
		next();
	}

	/* ------------------------------------------------------------------ */
	/* Editor helpers                                                       */
	/* ------------------------------------------------------------------ */

	function canvasDoc() {
		var iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
		return iframe && iframe.contentDocument ? iframe.contentDocument : document;
	}
	function q( sel, root ) {
		return ( root || canvasDoc() ).querySelector( sel );
	}
	function surface() {
		return q( '.vc-edit-surface' );
	}
	function htmlBlock() {
		var be = select( 'core/block-editor' );
		var ids = be.getClientIdsWithDescendants();
		for ( var i = 0; i < ids.length; i++ ) {
			var b = be.getBlock( ids[ i ] );
			if ( b && b.name === 'core/html' ) {
				return b;
			}
		}
		return null;
	}
	function selectHtmlBlock() {
		var b = htmlBlock();
		if ( b ) {
			dispatch( 'core/block-editor' ).selectBlock( b.clientId );
		}
		return b;
	}
	function waitFor( fn, timeout ) {
		timeout = timeout || 15000;
		return new Promise( function ( resolve, reject ) {
			var start = Date.now();
			( function poll() {
				var v;
				try {
					v = fn();
				} catch ( e ) {
					v = null;
				}
				if ( v ) {
					return resolve( v );
				}
				if ( Date.now() - start > timeout ) {
					return reject( new Error( 'timed out waiting' ) );
				}
				setTimeout( poll, 100 );
			} )();
		} );
	}
	function editedContent() {
		return select( 'core/editor' ).getEditedPostContent();
	}
	function savePost() {
		return dispatch( 'core/editor' ).savePost();
	}
	function storedRaw() {
		return wp.apiFetch( { path: '/wp/v2/pages/' + FIXTURE_ID + '?context=edit' } ).then( function ( p ) {
			return p.content.raw;
		} );
	}
	/** Replace an editable element's text and blur it so the plugin syncs. */
	function setText( el, text ) {
		el.focus();
		el.textContent = text;
		el.blur();
		// React listens for focusout; belt and braces for hidden-tab throttling.
		el.dispatchEvent( new FocusEvent( 'focusout', { bubbles: true } ) );
	}
	function selectAllTextIn( el ) {
		var d = el.ownerDocument;
		el.focus();
		var r = d.createRange();
		r.selectNodeContents( el );
		var s = d.getSelection();
		s.removeAllRanges();
		s.addRange( r );
		d.dispatchEvent( new Event( 'selectionchange' ) );
	}
	function formatBar() {
		return q( '.vc-format-bar' );
	}
	function toolbarButton( label ) {
		var btns = document.querySelectorAll( '.block-editor-block-toolbar button, .block-editor-block-contextual-toolbar button' );
		for ( var i = 0; i < btns.length; i++ ) {
			if ( btns[ i ].textContent.trim() === label ) {
				return btns[ i ];
			}
		}
		return null;
	}
	function heightOf( el ) {
		return el ? el.getBoundingClientRect().height : 0;
	}

	/* ------------------------------------------------------------------ */
	/* Tests — order matters: the "not dirty on open" check must run before  */
	/* anything selects the block.                                          */
	/* ------------------------------------------------------------------ */

	testAsync( 'editor is ready and the fixture block is present', function () {
		return waitFor( function () {
			return select( 'core/editor' ).getCurrentPostId() === FIXTURE_ID && htmlBlock() && surface();
		}, 30000 ).then( function () {
			expect( FIXTURE_ID > 0, 'no fixture page id' );
			expect( !! htmlBlock(), 'no core/html block in the fixture' );
			expect( !! surface(), 'Edit content surface not rendered' );
		} );
	} );

	test( 'merely opening the fixture does not mark the post as changed', function () {
		expect( select( 'core/editor' ).isEditedPostDirty() === false, 'post is dirty straight after load' );
	} );

	test( 'a saved block opens showing its content, not blank', function () {
		var h = q( '#fx-heading' );
		expect( !! h, '#fx-heading missing from the surface' );
		expect( h && h.textContent.trim() === 'Fixture heading', 'heading text wrong: ' + ( h && h.textContent ) );
		expect( !! q( '#fx-para' ), '#fx-para missing' );
	} );

	testAsync( 'selecting a saved block rebuilds it as a fresh block (0.6.1 save fix)', function () {
		var before = htmlBlock();
		expect( !! before.originalContent, 'expected the parsed block to carry originalContent before selection' );
		selectHtmlBlock();
		return waitFor( function () {
			var b = htmlBlock();
			return b && ! b.originalContent && b.attributes && b.attributes.content;
		} ).then( function () {
			var after = htmlBlock();
			expect( ! after.originalContent, 'block still carries originalContent after selection' );
			expect( /Fixture heading/.test( after.attributes.content ), 'rebuilt block lost its content' );
		} );
	} );

	testAsync( 'block toolbar shows Edit content and Edit code', function () {
		selectHtmlBlock();
		return waitFor( function () {
			return toolbarButton( 'Edit content' ) && toolbarButton( 'Edit code' );
		} ).then( function () {
			expect( !! toolbarButton( 'Edit content' ), 'no "Edit content" toolbar button' );
			expect( !! toolbarButton( 'Edit code' ), 'no "Edit code" toolbar button' );
		} );
	} );

	test( 'an absolute + inset image keeps its height in the editor (issue #4)', function () {
		var img = q( '#fx-img-abs' );
		expect( !! img, '#fx-img-abs missing' );
		var h = heightOf( img );
		expect( h > 150, 'absolute image collapsed: height ' + h + 'px (container is 240px)' );
	} );

	test( 'a percentage-height image keeps its height in the editor (issue #4)', function () {
		var img = q( '#fx-img-pct' );
		expect( !! img, '#fx-img-pct missing' );
		var h = heightOf( img );
		expect( h > 120, 'percentage-height image collapsed: height ' + h + 'px (container is 200px)' );
	} );

	test( 'ancestor-sized image wrappers are layout-transparent', function () {
		var img = q( '#fx-img-abs' );
		var wrap = img && img.closest( '.vc-image-editor' );
		expect( !! wrap, 'absolute image has no .vc-image-editor wrapper' );
		if ( wrap ) {
			expect( wrap.classList.contains( 'vc-image-editor--bare' ), 'wrapper is not marked --bare' );
			var display = canvasDoc().defaultView.getComputedStyle( wrap ).display;
			expect( display === 'contents', 'bare wrapper display is "' + display + '", expected "contents"' );
		}
	} );

	test( 'a normal image keeps its wrapper, badge and size', function () {
		var img = q( '#fx-img-normal' );
		expect( !! img, '#fx-img-normal missing' );
		var wrap = img && img.closest( '.vc-image-editor' );
		expect( !! wrap, 'normal image has no wrapper' );
		if ( wrap ) {
			expect( ! wrap.classList.contains( 'vc-image-editor--bare' ), 'normal image wrongly marked --bare' );
			expect( !! wrap.querySelector( '.vc-image-editor__badge' ), 'normal image has no Edit image badge' );
		}
		expect( heightOf( img ) > 100, 'normal image height is ' + heightOf( img ) + 'px' );
	} );

	test( 'a text edit is written into the block content', function () {
		var h = q( '#fx-heading' );
		setText( h, 'Edited heading' );
		var c = editedContent();
		expect( /Edited heading/.test( c ), 'edited text not in block content' );
		expect( ! /Fixture heading/.test( c ), 'old heading text still in block content' );
	} );

	test( 'text directly inside a div is editable (PR #3)', function () {
		var div = q( '#fx-div-text' );
		expect( !! div, '#fx-div-text missing' );
		expect( div && div.hasAttribute( 'data-vc-editable' ), 'div with direct text was not made editable' );
		expect( div && div.getAttribute( 'contenteditable' ) === 'true', 'div with direct text is not contenteditable' );
	} );

	test( 'a wrapper div holding only other elements is left alone (PR #3)', function () {
		var wrapper = q( '#fx-div-wrapper' );
		var child = q( '#fx-div-wrapper-child' );
		expect( !! wrapper && !! child, 'wrapper fixture missing' );
		expect( wrapper && ! wrapper.hasAttribute( 'data-vc-editable' ), 'layout wrapper div was wrongly made editable' );
		expect( child && child.hasAttribute( 'data-vc-editable' ), 'paragraph inside the wrapper should still be editable' );
	} );

	test( 'editing div text is written into the block content (PR #3)', function () {
		var div = q( '#fx-div-text' );
		setText( div, 'From $59 / night' );
		var c = editedContent();
		expect( /From \$59 \/ night/.test( c ), 'edited div text not in block content' );
		expect( ! /From \$49 \/ night/.test( c ), 'old div text still in block content' );
	} );

	testAsync( 'the edit persists to the database on save', function () {
		return savePost().then( storedRaw ).then( function ( raw ) {
			expect( /Edited heading/.test( raw ), 'saved content does not contain the edit' );
			expect( ! /Fixture heading/.test( raw ), 'saved content still has the old heading' );
			expect( /From \$59 \/ night/.test( raw ), 'edited div text did not save' );
		} );
	} );

	testAsync( 'untouched content is preserved verbatim on save', function () {
		return storedRaw().then( function ( raw ) {
			expect( raw.indexOf( '<p id="fx-untouched">Leave me exactly as I am.</p>' ) !== -1, 'untouched paragraph changed or lost' );
			expect( raw.indexOf( 'id="fx-img-abs"' ) !== -1, 'absolute image lost on save' );
		} );
	} );

	testAsync( 'no editing markup leaks into the saved page', function () {
		return storedRaw().then( function ( raw ) {
			expect( ! /contenteditable/.test( raw ), 'contenteditable leaked into saved HTML' );
			expect( ! /data-vc-(editable|image|link|image-wrap|link-wrap)/.test( raw ), 'data-vc-* editing attributes leaked' );
			expect( ! /vc-image-editor|vc-link-editor|vc-edit-surface|vc-format-bar/.test( raw ), 'editor wrapper classes leaked' );
		} );
	} );

	testAsync( 'bold from the format bubble saves as <strong>', function () {
		var el = q( '#fx-bold-target' );
		selectAllTextIn( el );
		return waitFor( function () {
			var bar = formatBar();
			return bar && bar.style.display !== 'none' && bar;
		} ).then( function ( bar ) {
			bar.querySelector( '[data-cmd="bold"]' ).click();
			var c = editedContent();
			expect( /<strong>make me bold<\/strong>/.test( c ), 'no <strong> in content: ' + snippet( c, 'make me bold' ) );
			expect( ! /<b>/.test( c ), 'raw <b> tag present' );
		} );
	} );

	testAsync( 'italic from the format bubble saves as <em>', function () {
		var el = q( '#fx-italic-target' );
		selectAllTextIn( el );
		return waitFor( function () {
			var bar = formatBar();
			return bar && bar.style.display !== 'none' && bar;
		} ).then( function ( bar ) {
			bar.querySelector( '[data-cmd="italic"]' ).click();
			var c = editedContent();
			expect( /<em>make me italic<\/em>/.test( c ), 'no <em> in content: ' + snippet( c, 'make me italic' ) );
			expect( ! /<i>/.test( c ), 'raw <i> tag present' );
		} );
	} );

	testAsync( 'adding a link from the format bubble wraps the selection in <a href>', function () {
		var el = q( '#fx-link-target' );
		selectAllTextIn( el );
		return waitFor( function () {
			var bar = formatBar();
			return bar && bar.style.display !== 'none' && bar;
		} ).then( function ( bar ) {
			bar.querySelector( '[data-cmd="link"]' ).click();
			var input = bar.querySelector( '.vc-format-bar__link input' );
			input.value = 'https://example.com/';
			bar.querySelector( '[data-cmd="apply-link"]' ).click();
			var c = editedContent();
			expect( /<a href="https:\/\/example\.com\/">link me please<\/a>/.test( c ), 'link not applied: ' + snippet( c, 'link me please' ) );
		} );
	} );

	testAsync( 'formatting persists to the database on save', function () {
		return savePost().then( storedRaw ).then( function ( raw ) {
			expect( /<strong>make me bold<\/strong>/.test( raw ), 'bold did not save' );
			expect( /<em>make me italic<\/em>/.test( raw ), 'italic did not save' );
			expect( /<a href="https:\/\/example\.com\/">link me please<\/a>/.test( raw ), 'link did not save' );
		} );
	} );

	testAsync( 'Edit code shows the raw HTML and Edit content round-trips it', function () {
		selectHtmlBlock();
		return waitFor( function () { return toolbarButton( 'Edit code' ); } )
			.then( function ( btn ) {
				btn.click();
				return waitFor( function () {
					var ta = q( 'textarea' );
					return ta && /Edited heading/.test( ta.value ) && ta;
				} );
			} )
			.then( function ( ta ) {
				expect( /<strong>make me bold<\/strong>/.test( ta.value ), 'code view missing the bold markup' );
				toolbarButton( 'Edit content' ).click();
				return waitFor( function () { return q( '#fx-heading' ); } );
			} )
			.then( function ( h ) {
				expect( h.textContent.trim() === 'Edited heading', 'round-trip lost the edited heading' );
			} );
	} );

	test( 'the write guard refused nothing (suite only wrote to the fixture page)', function () {
		expect( blocked.length === 0, 'blocked writes: ' + blocked.join( ', ' ) );
	} );

	function snippet( content, needle ) {
		var i = content.indexOf( needle );
		return i === -1 ? '(needle not found)' : content.slice( Math.max( 0, i - 40 ), i + needle.length + 40 );
	}

	/* ------------------------------------------------------------------ */
	/* Go                                                                   */
	/* ------------------------------------------------------------------ */

	function start() {
		drawPanel();
		runAll();
	}
	if ( document.readyState === 'complete' ) {
		setTimeout( start, 500 );
	} else {
		window.addEventListener( 'load', function () { setTimeout( start, 500 ); } );
	}
} )();
