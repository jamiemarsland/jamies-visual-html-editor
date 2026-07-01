<?php
/**
 * Main plugin orchestrator.
 *
 * @package JamiesVisualHtmlEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues the block-editor enhancement for the Custom HTML block and applies
 * Wide / Full alignment on the front end.
 */
class JVHE_Plugin {

	/**
	 * Register WordPress hooks.
	 */
	public function init() {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_filter( 'render_block', array( $this, 'apply_html_alignment' ), 10, 2 );
	}

	/**
	 * Apply Wide / Full alignment to the Custom HTML block on the front end.
	 *
	 * The core/html block has no save wrapper, so its `align` attribute (set in
	 * the editor via our alignment support) never reaches the front end markup.
	 * Here we wrap the rendered HTML in a container carrying the matching
	 * alignment class so the theme's constrained-layout CSS can break it out.
	 *
	 * Note on escaping: `$content` is the block output already rendered by
	 * WordPress core for the core/html block. The Custom HTML block intentionally
	 * stores and outputs raw author HTML (kses-filtered on save for users without
	 * the `unfiltered_html` capability), so it must NOT be escaped again here —
	 * doing so would corrupt the markup. The only value we add to the wrapper is a
	 * fixed, hard-coded CSS class chosen from a strict allow-list below, so no
	 * dynamic data is ever interpolated into the output.
	 *
	 * @param string $content Rendered block HTML.
	 * @param array  $block   Parsed block (name + attributes).
	 * @return string
	 */
	public function apply_html_alignment( $content, $block ) {
		if ( empty( $block['blockName'] ) || 'core/html' !== $block['blockName'] ) {
			return $content;
		}

		$align = isset( $block['attrs']['align'] ) ? $block['attrs']['align'] : '';

		// Strict allow-list: only ever emit a known, hard-coded class.
		if ( 'full' === $align ) {
			$align_class = 'alignfull';
		} elseif ( 'wide' === $align ) {
			$align_class = 'alignwide';
		} else {
			return $content;
		}

		return '<div class="wp-block-html ' . $align_class . '">' . $content . '</div>';
	}

	/**
	 * Enqueue the block-editor script and styles.
	 */
	public function enqueue_editor_assets() {
		$asset_file = JVHE_DIR . 'build/index.asset.php';

		$asset = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array( 'wp-hooks', 'wp-compose', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n' ),
				'version'      => JVHE_VERSION,
			);

		wp_enqueue_script(
			'jamies-visual-html-editor',
			JVHE_URL . 'build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'jamies-visual-html-editor', 'jamies-visual-html-editor' );

		$style_path = JVHE_DIR . 'build/index.css';

		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'jamies-visual-html-editor',
				JVHE_URL . 'build/index.css',
				array(),
				$asset['version']
			);
		}
	}
}
