/**
 * Jamie's Visual HTML Editor
 *
 * Enhances the core Custom HTML block (core/html):
 *   1. Adds an "Edit content" / "Edit code" toggle to the block toolbar.
 *   2. In "Edit content" mode, renders the HTML live and lets editors click
 *      text to edit it in place, click images to replace them, click links to
 *      edit them, and click hero backgrounds to swap the image.
 *   3. Adds Wide and Full width alignment support to the block.
 *
 * Built with @wordpress/scripts (`npm run build`).
 */

import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	useState,
	useRef,
	useCallback,
	useEffect,
	Fragment,
} from '@wordpress/element';
import {
	BlockControls,
	BlockAlignmentControl,
	useBlockProps,
	PlainText,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Modal,
	Button,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';
import { MediaUpload } from '@wordpress/media-utils';
import { __ } from '@wordpress/i18n';

import './editor.css';

/* -------------------------------------------------------------------------- */
/* Constants — data attributes and CSS classes used to mark up the editable   */
/* surface. These are stripped out again before the HTML is saved.            */
/* -------------------------------------------------------------------------- */

const EDITABLE_ATTR = 'data-vc-editable';
const IMAGE_ATTR = 'data-vc-image';
const IMAGE_WRAP_ATTR = 'data-vc-image-wrap';
const IMAGE_SELECTED = 'vc-image-selected';
const IMAGE_UPDATED = 'vc-image-updated';
const LINK_ATTR = 'data-vc-link';
const LINK_WRAP_ATTR = 'data-vc-link-wrap';
const LINK_SELECTED = 'vc-link-selected';
const LINK_UPDATED = 'vc-link-updated';
const BG_STYLE_INDEX_ATTR = 'data-vc-bg-style-index';
const BG_SELECTOR_ATTR = 'data-vc-bg-selector';
const BG_EDITOR = 'vc-bg-editor';
const BG_SELECTED = 'vc-bg-selected';
const BG_UPDATED = 'vc-bg-updated';

const URL_REGEX = /url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi;

const FEEDBACK_DELAY = 2000;

/* -------------------------------------------------------------------------- */
/* Small DOM helpers                                                          */
/* -------------------------------------------------------------------------- */

function readImage( img ) {
	return {
		src: img.getAttribute( 'src' ) || '',
		alt: img.getAttribute( 'alt' ) || '',
	};
}

function applyImageToElement( img, changes ) {
	if ( changes.src !== undefined ) {
		img.setAttribute( 'src', changes.src );
		img.removeAttribute( 'srcset' );
		img.removeAttribute( 'sizes' );
	}
	if ( changes.alt !== undefined ) {
		img.setAttribute( 'alt', changes.alt );
	}
}

function readLink( anchor ) {
	return {
		href: anchor.getAttribute( 'href' ) || '',
		text: ( anchor.innerText || anchor.textContent || '' ).trim(),
		newTab: anchor.getAttribute( 'target' ) === '_blank',
	};
}

function applyLinkToElement( anchor, changes ) {
	if ( changes.href !== undefined ) {
		anchor.setAttribute( 'href', changes.href );
	}
	if ( changes.text !== undefined ) {
		anchor.textContent = changes.text;
	}
	if ( changes.newTab !== undefined ) {
		if ( changes.newTab ) {
			anchor.setAttribute( 'target', '_blank' );
		} else {
			anchor.removeAttribute( 'target' );
		}
	}
}

function escapeRegExp( string ) {
	return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/* -------------------------------------------------------------------------- */
/* Background-image helpers                                                    */
/*                                                                            */
/* A background can be set two ways: inline on the element's style attribute,  */
/* or via a CSS rule inside a <style> block in the pasted HTML. We track which */
/* one applies to a given element so we can read and rewrite the correct URL.  */
/* -------------------------------------------------------------------------- */

function extractInlineBgUrl( element ) {
	const sources = [
		element.style.backgroundImage,
		element.getAttribute( 'style' ) || '',
	];
	for ( const source of sources ) {
		if ( ! source || source === 'none' ) {
			continue;
		}
		const matches = [ ...String( source ).matchAll( URL_REGEX ) ];
		if ( matches.length ) {
			return matches[ matches.length - 1 ][ 2 ];
		}
	}
	return '';
}

function getStyleRuleRef( element, root ) {
	const index = element.getAttribute( BG_STYLE_INDEX_ATTR );
	const selector = element.getAttribute( BG_SELECTOR_ATTR );
	if ( index === null || ! selector || ! root ) {
		return null;
	}
	const styleEl = root.querySelectorAll( 'style' )[ parseInt( index, 10 ) ];
	return styleEl ? { styleEl, selector } : null;
}

function readBgUrlFromStyleRule( styleEl, selector ) {
	const css = styleEl.textContent || '';
	const ruleRegex = new RegExp(
		escapeRegExp( selector.trim() ) + '\\s*\\{([^}]*)\\}',
		'i'
	);
	const match = css.match( ruleRegex );
	if ( ! match ) {
		return '';
	}
	const urls = [ ...String( match[ 1 ] ).matchAll( URL_REGEX ) ];
	return urls.length ? urls[ urls.length - 1 ][ 2 ] : '';
}

/**
 * Replace the last url(...) in a CSS declaration string, or append a
 * background-image declaration if there isn't one yet.
 */
function setUrlInBackground( declaration, url ) {
	const urlValue =
		'url("' + url.replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' ) + '")';

	let match;
	let last = null;
	URL_REGEX.lastIndex = 0;
	while ( ( match = URL_REGEX.exec( declaration ) ) !== null ) {
		last = match;
	}

	if ( ! last ) {
		const trimmed = declaration.trim();
		let separator = '';
		if ( trimmed ) {
			separator = trimmed.endsWith( ';' ) ? ' ' : '; ';
		}
		return trimmed + separator + 'background-image: ' + urlValue;
	}

	return (
		declaration.slice( 0, last.index ) +
		urlValue +
		declaration.slice( last.index + last[ 0 ].length )
	);
}

function writeBgUrlToStyleRule( styleEl, selector, url ) {
	const css = styleEl.textContent || '';
	const ruleRegex = new RegExp(
		'(\\s*' + escapeRegExp( selector.trim() ) + '\\s*\\{)([^}]*)(\\})',
		'i'
	);
	const match = css.match( ruleRegex );
	if ( match ) {
		styleEl.textContent = css.replace(
			ruleRegex,
			match[ 1 ] + setUrlInBackground( match[ 2 ], url ) + match[ 3 ]
		);
	}
}

function readElementBgUrl( element, root ) {
	const ref = getStyleRuleRef( element, root );
	if ( ref ) {
		return { url: readBgUrlFromStyleRule( ref.styleEl, ref.selector ) };
	}
	return { url: extractInlineBgUrl( element ) };
}

function applyBgToElement( element, root, changes ) {
	if ( changes.url === undefined ) {
		return;
	}
	const ref = getStyleRuleRef( element, root );
	if ( ref ) {
		writeBgUrlToStyleRule( ref.styleEl, ref.selector, changes.url );
		return;
	}
	const style = element.getAttribute( 'style' ) || '';
	element.setAttribute(
		'style',
		changes.url
			? setUrlInBackground( style, changes.url )
			: style.replace( /background-image\s*:\s*[^;]+;?\s*/gi, '' )
	);
}

function decorateBgElement( element, doc ) {
	if ( element.classList.contains( BG_EDITOR ) ) {
		return;
	}
	element.classList.add( BG_EDITOR );
	const badge = doc.createElement( 'button' );
	badge.type = 'button';
	badge.className = 'vc-bg-editor__badge';
	badge.textContent = __( 'Edit background', 'jamies-visual-html-editor' );
	element.appendChild( badge );
}

function preventLinkClick( event ) {
	event.preventDefault();
}

/* -------------------------------------------------------------------------- */
/* Decoration — turn pasted HTML into an editable surface                      */
/* -------------------------------------------------------------------------- */

function decorateText( container ) {
	container
		.querySelectorAll(
			'h1, h2, h3, h4, h5, h6, p, li, span, a, button, blockquote, figcaption, label, strong, em'
		)
		.forEach( ( element ) => {
			if ( element.closest( 'style, script, svg' ) ) {
				return;
			}
			if (
				element.parentElement &&
				element.parentElement.closest( '[' + EDITABLE_ATTR + ']' )
			) {
				return;
			}
			element.setAttribute( 'contenteditable', 'true' );
			element.setAttribute( EDITABLE_ATTR, '1' );
			element.setAttribute( 'spellcheck', 'true' );
			if ( element.tagName === 'A' ) {
				element.addEventListener( 'click', preventLinkClick );
			}
		} );

	container
		.querySelectorAll( 'style, script, svg' )
		.forEach( ( element ) =>
			element.setAttribute( 'contenteditable', 'false' )
		);
}

function decorateImages( container ) {
	container.querySelectorAll( 'img' ).forEach( ( img ) => {
		if (
			img.closest( 'svg' ) ||
			img.closest( '[' + IMAGE_WRAP_ATTR + ']' )
		) {
			return;
		}
		img.setAttribute( 'contenteditable', 'false' );
		img.setAttribute( IMAGE_ATTR, '1' );

		const doc = container.ownerDocument;
		const wrap = doc.createElement( 'span' );
		wrap.className = 'vc-image-editor';
		wrap.setAttribute( IMAGE_WRAP_ATTR, '1' );

		const badge = doc.createElement( 'span' );
		badge.className = 'vc-image-editor__badge';
		badge.textContent = __( 'Edit image', 'jamies-visual-html-editor' );

		const parent = img.parentNode;
		if ( parent ) {
			parent.insertBefore( wrap, img );
			wrap.appendChild( img );
			wrap.appendChild( badge );
		}
	} );
}

function decorateLinks( container ) {
	container.querySelectorAll( 'a[href]' ).forEach( ( anchor ) => {
		if (
			anchor.closest( 'svg' ) ||
			anchor.closest( '[' + LINK_WRAP_ATTR + ']' )
		) {
			return;
		}
		anchor.setAttribute( LINK_ATTR, '1' );

		const doc = container.ownerDocument;
		const wrap = doc.createElement( 'span' );
		wrap.className = 'vc-link-editor';
		wrap.setAttribute( LINK_WRAP_ATTR, '1' );

		const badge = doc.createElement( 'button' );
		badge.type = 'button';
		badge.className = 'vc-link-editor__badge';
		badge.textContent = __( 'Edit link', 'jamies-visual-html-editor' );

		const parent = anchor.parentNode;
		if ( parent ) {
			parent.insertBefore( wrap, anchor );
			wrap.appendChild( anchor );
			wrap.appendChild( badge );
		}
	} );
}

/**
 * Find CSS rules in <style> blocks that set a background image, so the
 * matching elements can be made editable.
 */
function collectBgStyleRules( container ) {
	const rules = [];
	container.querySelectorAll( 'style' ).forEach( ( styleEl, styleIndex ) => {
		const css = styleEl.textContent || '';
		const ruleRegex = /([^{]+)\{([^}]+)\}/g;
		let match;
		while ( ( match = ruleRegex.exec( css ) ) !== null ) {
			const selector = match[ 1 ].trim();
			const body = match[ 2 ];
			if (
				selector &&
				/background/i.test( body ) &&
				/url\s*\(/i.test( body )
			) {
				rules.push( { styleEl, styleIndex, selector } );
			}
		}
	} );
	return rules;
}

function decorateBackgrounds( container ) {
	// Elements explicitly tagged by the author with data-vc-bg.
	container.querySelectorAll( '[data-vc-bg]' ).forEach( ( element ) => {
		if ( ! element.closest( 'svg' ) ) {
			decorateBgElement( element, container.ownerDocument );
		}
	} );

	// Elements whose background image comes from a <style> rule.
	collectBgStyleRules( container ).forEach( ( { styleIndex, selector } ) => {
		let nodes;
		try {
			nodes = container.querySelectorAll( selector );
		} catch ( error ) {
			return;
		}
		nodes.forEach( ( node ) => {
			if (
				! node.closest( 'style, script, svg' ) &&
				container.contains( node )
			) {
				node.setAttribute( BG_STYLE_INDEX_ATTR, String( styleIndex ) );
				node.setAttribute( BG_SELECTOR_ATTR, selector );
				decorateBgElement( node, container.ownerDocument );
			}
		} );
	} );
}

/**
 * Inject the outline/badge styles for the edit surface into the editor
 * document once.
 */
function injectEditStyles( doc ) {
	if ( ! doc ) {
		return;
	}
	let styleEl = doc.getElementById( 'vc-inline-edit-styles' );
	if ( ! styleEl ) {
		styleEl = doc.createElement( 'style' );
		styleEl.id = 'vc-inline-edit-styles';
		( doc.head || doc.body ).appendChild( styleEl );
	}
	styleEl.textContent = `
		.vc-edit-surface [${ EDITABLE_ATTR }] {
			cursor: text;
			transition: outline-color 120ms ease, background-color 120ms ease;
			outline: 1px dashed transparent;
			outline-offset: 2px;
			border-radius: 2px;
		}
		.vc-edit-surface [${ EDITABLE_ATTR }]:hover {
			outline-color: rgba(0, 124, 186, 0.6);
			background-color: rgba(0, 124, 186, 0.06);
		}
		.vc-edit-surface [${ EDITABLE_ATTR }]:focus {
			outline: 2px solid #007cba;
			outline-offset: 2px;
			background-color: rgba(0, 124, 186, 0.08);
		}
		.vc-edit-surface [${ IMAGE_ATTR }] {
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
		.vc-edit-surface [${ IMAGE_ATTR }]:hover,
		.vc-edit-surface .vc-image-editor:hover [${ IMAGE_ATTR }] {
			outline-color: rgba(147, 51, 234, 0.7);
			box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.08);
		}
		.vc-edit-surface .vc-image-editor:hover .vc-image-editor__badge,
		.vc-edit-surface .vc-image-editor:has(.${ IMAGE_SELECTED }) .vc-image-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .${ IMAGE_SELECTED } {
			outline: 2px solid #9333ea;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.12);
		}
		.vc-edit-surface .vc-image-editor.${ IMAGE_UPDATED } [${ IMAGE_ATTR }] {
			outline: 2px solid #00a32a;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(0, 163, 42, 0.15);
		}
		.vc-edit-surface .vc-image-editor.${ IMAGE_UPDATED } .vc-image-editor__badge {
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
		.vc-edit-surface .vc-link-editor:has(.${ LINK_SELECTED }) .vc-link-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .vc-link-editor [${ LINK_ATTR }] {
			transition: outline-color 120ms ease, box-shadow 120ms ease;
		}
		.vc-edit-surface .vc-link-editor:hover [${ LINK_ATTR }],
		.vc-edit-surface .${ LINK_SELECTED } {
			outline: 2px solid #d97706;
			outline-offset: 2px;
			box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.12);
		}
		.vc-edit-surface .vc-link-editor.${ LINK_UPDATED } .vc-link-editor__badge {
			opacity: 1;
			background: rgba(0, 163, 42, 0.95);
		}
		.vc-edit-surface .${ BG_EDITOR } {
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
		.vc-edit-surface .${ BG_EDITOR }:hover .vc-bg-editor__badge,
		.vc-edit-surface .${ BG_EDITOR }.${ BG_SELECTED } .vc-bg-editor__badge {
			opacity: 1;
		}
		.vc-edit-surface .${ BG_EDITOR }:hover,
		.vc-edit-surface .${ BG_EDITOR }.${ BG_SELECTED } {
			outline: 2px solid #2563eb;
			outline-offset: -2px;
			box-shadow: inset 0 0 0 4px rgba(37, 99, 235, 0.15);
		}
		.vc-edit-surface .${ BG_EDITOR }.${ BG_UPDATED } .vc-bg-editor__badge {
			opacity: 1;
			background: rgba(0, 163, 42, 0.95);
		}
	`;
}

/* -------------------------------------------------------------------------- */
/* Visual editor — the "Edit content" view                                    */
/* -------------------------------------------------------------------------- */

function VisualEditor( { content, setContent } ) {
	const containerRef = useRef( null );
	const lastHtmlRef = useRef( null );
	const selectedImageRef = useRef( null );
	const selectedLinkRef = useRef( null );
	const selectedBgRef = useRef( null );
	const suppressBlurRef = useRef( false );

	const [ imageModalOpen, setImageModalOpen ] = useState( false );
	const [ linkModalOpen, setLinkModalOpen ] = useState( false );
	const [ bgModalOpen, setBgModalOpen ] = useState( false );

	const [ imageData, setImageData ] = useState( { src: '', alt: '' } );
	const [ linkData, setLinkData ] = useState( {
		href: '',
		text: '',
		newTab: false,
	} );
	const [ bgData, setBgData ] = useState( { url: '' } );

	const feedbackTimerRef = useRef( null );

	/**
	 * Serialize the edited surface back to clean HTML and push it to the block,
	 * stripping every editing-only wrapper, attribute, class and badge.
	 */
	const syncContent = useCallback( () => {
		const container = containerRef.current;
		if ( ! container ) {
			return;
		}

		const clone = container.ownerDocument.createElement( 'div' );
		clone.innerHTML = container.innerHTML;

		// Unwrap image wrappers.
		clone
			.querySelectorAll( '[' + IMAGE_WRAP_ATTR + ']' )
			.forEach( ( wrap ) => {
				const img = wrap.querySelector( 'img' );
				if ( img && wrap.parentNode ) {
					wrap.parentNode.insertBefore( img, wrap );
					wrap.remove();
				}
			} );

		// Unwrap link wrappers.
		clone
			.querySelectorAll( '[' + LINK_WRAP_ATTR + ']' )
			.forEach( ( wrap ) => {
				const anchor = wrap.querySelector( 'a' );
				if ( anchor && wrap.parentNode ) {
					wrap.parentNode.insertBefore( anchor, wrap );
					wrap.remove();
				}
			} );

		// Remove editing attributes and selection classes.
		clone
			.querySelectorAll(
				'[contenteditable], [' +
					EDITABLE_ATTR +
					'], [' +
					IMAGE_ATTR +
					'], [' +
					LINK_ATTR +
					'], [spellcheck], .' +
					IMAGE_SELECTED +
					', .' +
					LINK_SELECTED +
					', .vc-image-editor__badge, .vc-link-editor__badge'
			)
			.forEach( ( element ) => {
				element.removeAttribute( 'contenteditable' );
				element.removeAttribute( EDITABLE_ATTR );
				element.removeAttribute( IMAGE_ATTR );
				element.removeAttribute( LINK_ATTR );
				element.removeAttribute( 'spellcheck' );
				element.classList.remove( IMAGE_SELECTED );
				element.classList.remove( LINK_SELECTED );
			} );

		// Remove any remaining badges.
		clone
			.querySelectorAll(
				'.vc-image-editor__badge, .vc-link-editor__badge, .vc-bg-editor__badge'
			)
			.forEach( ( element ) => element.remove() );

		// Strip background-editor markers.
		clone.querySelectorAll( '.' + BG_EDITOR ).forEach( ( element ) => {
			element.classList.remove( BG_EDITOR, BG_SELECTED, BG_UPDATED );
			element.removeAttribute( BG_STYLE_INDEX_ATTR );
			element.removeAttribute( BG_SELECTOR_ATTR );
		} );

		const html = clone.innerHTML;
		if ( html !== lastHtmlRef.current ) {
			lastHtmlRef.current = html;
			setContent( html );
		}
	}, [ setContent ] );

	// Always call the latest syncContent from stable callbacks.
	const syncContentRef = useRef( syncContent );
	syncContentRef.current = syncContent;

	const closeImageModal = useCallback( () => {
		const img = selectedImageRef.current;
		if ( img ) {
			img.classList.remove( IMAGE_SELECTED );
		}
		selectedImageRef.current = null;
		setImageModalOpen( false );
	}, [] );

	const closeLinkModal = useCallback( () => {
		const anchor = selectedLinkRef.current;
		if ( anchor ) {
			anchor.classList.remove( LINK_SELECTED );
		}
		selectedLinkRef.current = null;
		setLinkModalOpen( false );
	}, [] );

	const closeBgModal = useCallback( () => {
		const element = selectedBgRef.current;
		if ( element ) {
			element.classList.remove( BG_SELECTED );
		}
		selectedBgRef.current = null;
		setBgModalOpen( false );
	}, [] );

	const updateSelectedImage = useCallback( ( changes ) => {
		const img = selectedImageRef.current;
		if ( img ) {
			applyImageToElement( img, changes );
			setImageData( readImage( img ) );
			syncContentRef.current();
		}
	}, [] );

	const updateSelectedLink = useCallback( ( changes ) => {
		const anchor = selectedLinkRef.current;
		if ( anchor ) {
			applyLinkToElement( anchor, changes );
			setLinkData( readLink( anchor ) );
			syncContentRef.current();
		}
	}, [] );

	const updateSelectedBg = useCallback( ( changes ) => {
		const element = selectedBgRef.current;
		const root = containerRef.current;
		if ( element ) {
			applyBgToElement( element, root, changes );
			setBgData( readElementBgUrl( element, root ) );
			syncContentRef.current();
		}
	}, [] );

	const selectBg = useCallback( ( element ) => {
		if (
			selectedBgRef.current &&
			selectedBgRef.current !== element
		) {
			selectedBgRef.current.classList.remove( BG_SELECTED );
		}
		selectedBgRef.current = element;
		element.classList.add( BG_SELECTED );
		setBgData( readElementBgUrl( element, containerRef.current ) );
		setBgModalOpen( true );
	}, [] );

	const flashBgUpdated = useCallback( ( element ) => {
		element.classList.add( BG_UPDATED );
		const badge = element.querySelector( '.vc-bg-editor__badge' );
		if ( badge ) {
			badge.textContent = __(
				'Background updated',
				'jamies-visual-html-editor'
			);
		}
		if ( feedbackTimerRef.current ) {
			window.clearTimeout( feedbackTimerRef.current );
		}
		feedbackTimerRef.current = window.setTimeout( () => {
			element.classList.remove( BG_UPDATED );
			if ( badge ) {
				badge.textContent = __(
					'Edit background',
					'jamies-visual-html-editor'
				);
			}
			feedbackTimerRef.current = null;
		}, FEEDBACK_DELAY );
	}, [] );

	const selectLink = useCallback( ( anchor ) => {
		if (
			selectedLinkRef.current &&
			selectedLinkRef.current !== anchor
		) {
			selectedLinkRef.current.classList.remove( LINK_SELECTED );
		}
		selectedLinkRef.current = anchor;
		anchor.classList.add( LINK_SELECTED );
		setLinkData( readLink( anchor ) );
		setLinkModalOpen( true );
	}, [] );

	const flashLinkUpdated = useCallback( ( anchor ) => {
		const wrap = anchor.closest( '[' + LINK_WRAP_ATTR + ']' );
		if ( ! wrap ) {
			return;
		}
		const badge = wrap.querySelector( '.vc-link-editor__badge' );
		wrap.classList.add( LINK_UPDATED );
		if ( badge ) {
			badge.textContent = __(
				'Link updated',
				'jamies-visual-html-editor'
			);
		}
		if ( feedbackTimerRef.current ) {
			window.clearTimeout( feedbackTimerRef.current );
		}
		feedbackTimerRef.current = window.setTimeout( () => {
			wrap.classList.remove( LINK_UPDATED );
			if ( badge ) {
				badge.textContent = __(
					'Edit link',
					'jamies-visual-html-editor'
				);
			}
			feedbackTimerRef.current = null;
		}, FEEDBACK_DELAY );
	}, [] );

	const selectImage = useCallback( ( img ) => {
		if (
			selectedImageRef.current &&
			selectedImageRef.current !== img
		) {
			selectedImageRef.current.classList.remove( IMAGE_SELECTED );
		}
		selectedImageRef.current = img;
		img.classList.add( IMAGE_SELECTED );
		setImageData( readImage( img ) );
		setImageModalOpen( true );
	}, [] );

	const flashImageUpdated = useCallback( ( img ) => {
		const wrap = img.closest( '[' + IMAGE_WRAP_ATTR + ']' );
		if ( ! wrap ) {
			return;
		}
		const badge = wrap.querySelector( '.vc-image-editor__badge' );
		wrap.classList.add( IMAGE_UPDATED );
		if ( badge ) {
			badge.textContent = __(
				'Image updated',
				'jamies-visual-html-editor'
			);
		}
		if ( feedbackTimerRef.current ) {
			window.clearTimeout( feedbackTimerRef.current );
		}
		feedbackTimerRef.current = window.setTimeout( () => {
			wrap.classList.remove( IMAGE_UPDATED );
			if ( badge ) {
				badge.textContent = __(
					'Edit image',
					'jamies-visual-html-editor'
				);
			}
			feedbackTimerRef.current = null;
		}, FEEDBACK_DELAY );
	}, [] );

	// Clear any pending feedback timer on unmount.
	useEffect(
		() => () => {
			if ( feedbackTimerRef.current ) {
				window.clearTimeout( feedbackTimerRef.current );
			}
		},
		[]
	);

	// Render incoming content into the surface and (re)decorate it.
	useEffect( () => {
		const container = containerRef.current;
		if ( ! container || content === lastHtmlRef.current ) {
			return;
		}
		closeImageModal();
		closeLinkModal();
		closeBgModal();
		container.innerHTML = content || '';
		lastHtmlRef.current = content;
		decorateText( container );
		decorateImages( container );
		decorateLinks( container );
		decorateBackgrounds( container );
		injectEditStyles( container.ownerDocument );
	}, [ content, closeImageModal, closeLinkModal, closeBgModal ] );

	// Intercept clicks on images, link badges and background badges.
	useEffect( () => {
		const container = containerRef.current;
		if ( ! container ) {
			return;
		}
		const onMouseDown = ( event ) => {
			const bgBadge = event.target.closest( '.vc-bg-editor__badge' );
			if ( bgBadge ) {
				const bgEl = bgBadge.closest( '.' + BG_EDITOR );
				if (
					bgEl &&
					bgEl.classList.contains( BG_EDITOR ) &&
					container.contains( bgEl ) &&
					! bgEl.closest( 'svg' )
				) {
					event.preventDefault();
					event.stopPropagation();
					suppressBlurRef.current = true;
					selectBg( bgEl );
				}
				return;
			}

			const linkBadge = event.target.closest(
				'.vc-link-editor__badge'
			);
			if ( linkBadge ) {
				const wrap = linkBadge.closest( '[' + LINK_WRAP_ATTR + ']' );
				const anchor = wrap?.querySelector( 'a[' + LINK_ATTR + ']' );
				if (
					anchor &&
					container.contains( anchor ) &&
					! anchor.closest( 'svg' )
				) {
					event.preventDefault();
					event.stopPropagation();
					suppressBlurRef.current = true;
					selectLink( anchor );
				}
				return;
			}

			const imgWrap = event.target.closest(
				'[' + IMAGE_WRAP_ATTR + ']'
			);
			const img =
				event.target.closest( 'img' ) ||
				( imgWrap ? imgWrap.querySelector( 'img' ) : null );
			if (
				img &&
				container.contains( img ) &&
				! img.closest( 'svg' ) &&
				img.hasAttribute( IMAGE_ATTR )
			) {
				event.preventDefault();
				event.stopPropagation();
				suppressBlurRef.current = true;
				selectImage( img );
			}
		};

		container.addEventListener( 'mousedown', onMouseDown, true );
		return () =>
			container.removeEventListener( 'mousedown', onMouseDown, true );
	}, [ selectImage, selectLink, selectBg ] );

	const handleImageMediaSelect = useCallback(
		( media ) => {
			const img = selectedImageRef.current;
			if ( img ) {
				updateSelectedImage( {
					src: media.url,
					alt: media.alt || imageData.alt,
				} );
				closeImageModal();
				flashImageUpdated( img );
			}
		},
		[ updateSelectedImage, imageData.alt, closeImageModal, flashImageUpdated ]
	);

	const handleBgMediaSelect = useCallback(
		( media ) => {
			const element = selectedBgRef.current;
			if ( element ) {
				updateSelectedBg( { url: media.url } );
				closeBgModal();
				flashBgUpdated( element );
			}
		},
		[ updateSelectedBg, closeBgModal, flashBgUpdated ]
	);

	const handleBgDone = useCallback( () => {
		const element = selectedBgRef.current;
		if ( element ) {
			flashBgUpdated( element );
		}
		closeBgModal();
	}, [ closeBgModal, flashBgUpdated ] );

	const handleLinkDone = useCallback( () => {
		const anchor = selectedLinkRef.current;
		if ( anchor ) {
			flashLinkUpdated( anchor );
		}
		closeLinkModal();
	}, [ closeLinkModal, flashLinkUpdated ] );

	return (
		<Fragment>
			<div
				ref={ containerRef }
				className="vc-edit-surface"
				onBlur={ () => {
					if ( suppressBlurRef.current ) {
						suppressBlurRef.current = false;
					} else {
						syncContent();
					}
				} }
				onPaste={ ( event ) => {
					const target = event.target;
					if (
						! target ||
						! target.closest( '[' + EDITABLE_ATTR + ']' )
					) {
						return;
					}
					event.preventDefault();
					const text = (
						event.clipboardData || window.clipboardData
					).getData( 'text' );
					target.ownerDocument.execCommand(
						'insertText',
						false,
						text
					);
				} }
				onKeyDown={ ( event ) => {
					const target = event.target;
					if (
						target &&
						target.closest &&
						target.closest( '[' + EDITABLE_ATTR + ']' )
					) {
						event.stopPropagation();
						if ( event.key === 'Enter' && ! event.shiftKey ) {
							event.preventDefault();
							target.blur();
						}
					}
				} }
			/>

			{ imageModalOpen && (
				<Modal
					title={ __( 'Edit image', 'jamies-visual-html-editor' ) }
					onRequestClose={ closeImageModal }
					className="vc-image-modal"
				>
					<div className="vc-edit-modal__fields">
						{ imageData.src && (
							<div className="vc-image-modal__preview">
								<img src={ imageData.src } alt={ imageData.alt } />
							</div>
						) }
						<MediaUploadCheck>
							<MediaUpload
								allowedTypes={ [ 'image' ] }
								value={
									imageData.src
										? { url: imageData.src }
										: undefined
								}
								onSelect={ handleImageMediaSelect }
								render={ ( { open } ) => (
									<Button variant="primary" onClick={ open }>
										{ __(
											'Replace from Media Library',
											'jamies-visual-html-editor'
										) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
						<TextControl
							label={ __(
								'Image URL',
								'jamies-visual-html-editor'
							) }
							value={ imageData.src }
							onChange={ ( value ) =>
								updateSelectedImage( { src: value } )
							}
						/>
						<TextControl
							label={ __(
								'Alt text',
								'jamies-visual-html-editor'
							) }
							value={ imageData.alt }
							onChange={ ( value ) =>
								updateSelectedImage( { alt: value } )
							}
						/>
						<div className="vc-edit-modal__actions">
							<Button
								variant="primary"
								onClick={ closeImageModal }
							>
								{ __( 'Done', 'jamies-visual-html-editor' ) }
							</Button>
						</div>
					</div>
				</Modal>
			) }

			{ linkModalOpen && (
				<Modal
					title={ __( 'Edit link', 'jamies-visual-html-editor' ) }
					onRequestClose={ closeLinkModal }
					className="vc-link-modal"
				>
					<div className="vc-edit-modal__fields">
						<TextControl
							label={ __(
								'Link URL',
								'jamies-visual-html-editor'
							) }
							value={ linkData.href }
							onChange={ ( value ) =>
								updateSelectedLink( { href: value } )
							}
						/>
						<TextControl
							label={ __(
								'Link text',
								'jamies-visual-html-editor'
							) }
							value={ linkData.text }
							onChange={ ( value ) =>
								updateSelectedLink( { text: value } )
							}
						/>
						<CheckboxControl
							label={ __(
								'Open in new tab',
								'jamies-visual-html-editor'
							) }
							checked={ linkData.newTab }
							onChange={ ( value ) =>
								updateSelectedLink( { newTab: value } )
							}
						/>
						<div className="vc-edit-modal__actions">
							<Button variant="primary" onClick={ handleLinkDone }>
								{ __( 'Done', 'jamies-visual-html-editor' ) }
							</Button>
						</div>
					</div>
				</Modal>
			) }

			{ bgModalOpen && (
				<Modal
					title={ __(
						'Edit background',
						'jamies-visual-html-editor'
					) }
					onRequestClose={ closeBgModal }
					className="vc-bg-modal"
				>
					<div className="vc-edit-modal__fields">
						{ bgData.url && (
							<div
								className="vc-bg-modal__preview"
								style={ {
									backgroundImage:
										'url("' + bgData.url + '")',
								} }
							/>
						) }
						<MediaUploadCheck>
							<MediaUpload
								allowedTypes={ [ 'image' ] }
								onSelect={ handleBgMediaSelect }
								render={ ( { open } ) => (
									<Button variant="primary" onClick={ open }>
										{ __(
											'Replace from Media Library',
											'jamies-visual-html-editor'
										) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
						<TextControl
							label={ __(
								'Background image URL',
								'jamies-visual-html-editor'
							) }
							value={ bgData.url }
							onChange={ ( value ) =>
								updateSelectedBg( { url: value } )
							}
						/>
						<div className="vc-edit-modal__actions">
							<Button variant="primary" onClick={ handleBgDone }>
								{ __( 'Done', 'jamies-visual-html-editor' ) }
							</Button>
						</div>
					</div>
				</Modal>
			) }
		</Fragment>
	);
}

/* -------------------------------------------------------------------------- */
/* Block edit wrapper — toolbar toggle between content and code views         */
/* -------------------------------------------------------------------------- */

function EditHtmlBlock( { attributes, setAttributes } ) {
	const [ mode, setMode ] = useState( () =>
		attributes.content && attributes.content.trim() ? 'text' : 'code'
	);
	const blockProps = useBlockProps( { className: 'vc-html-edit' } );
	const setContent = ( content ) => setAttributes( { content } );

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						isPressed={ mode === 'text' }
						onClick={ () => setMode( 'text' ) }
					>
						{ __( 'Edit content', 'jamies-visual-html-editor' ) }
					</ToolbarButton>
					<ToolbarButton
						isPressed={ mode === 'code' }
						onClick={ () => setMode( 'code' ) }
					>
						{ __( 'Edit code', 'jamies-visual-html-editor' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<BlockControls group="block">
				<BlockAlignmentControl
					value={ attributes.align }
					onChange={ ( align ) => setAttributes( { align } ) }
					controls={ [ 'wide', 'full' ] }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ mode === 'text' ? (
					<VisualEditor
						content={ attributes.content }
						setContent={ setContent }
					/>
				) : (
					<PlainText
						value={ attributes.content }
						onChange={ setContent }
						className="vc-html-edit__code"
						placeholder={ __(
							'Paste or write HTML here, then switch to “Edit content”.',
							'jamies-visual-html-editor'
						) }
						aria-label={ __(
							'Custom HTML',
							'jamies-visual-html-editor'
						) }
					/>
				) }
			</div>
		</Fragment>
	);
}

/* -------------------------------------------------------------------------- */
/* Register filters                                                           */
/* -------------------------------------------------------------------------- */

addFilter(
	'editor.BlockEdit',
	'jamies-visual-html-editor/html-text-edit',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) =>
			props.name === 'core/html' ? (
				<EditHtmlBlock { ...props } />
			) : (
				<BlockEdit { ...props } />
			),
		'withHtmlTextEdit'
	)
);

addFilter(
	'blocks.registerBlockType',
	'jamies-visual-html-editor/html-align-support',
	( settings, name ) => {
		if ( name !== 'core/html' ) {
			return settings;
		}
		return {
			...settings,
			supports: {
				...settings.supports,
				align: [ 'wide', 'full' ],
			},
			attributes: {
				...settings.attributes,
				align: { type: 'string' },
			},
		};
	}
);
