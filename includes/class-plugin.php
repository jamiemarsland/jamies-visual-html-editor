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
		add_action( 'admin_init', array( $this, 'maybe_enter_test_mode' ) );
	}

	/* ---------------------------------------------------------------------- */
	/* In-browser test suite (development only)                               */
	/*                                                                        */
	/* Visiting wp-admin with ?vhe-test=1 opens a dedicated fixture page in the */
	/* block editor with tests/vhe-tests.js loaded, which runs the suite and   */
	/* draws a results panel. The suite only ever touches that fixture page.  */
	/* Inert in shipped builds: tests/ is not included in the release zip.    */
	/* ---------------------------------------------------------------------- */

	const TEST_FIXTURE_SLUG = 'vhe-test-fixture';

	/**
	 * Whether this request is a test-mode request from a capable user and the
	 * (development-only) test files are present.
	 *
	 * @return bool
	 */
	private function is_test_mode() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only dev flag, capability-gated.
		if ( empty( $_GET['vhe-test'] ) ) {
			return false;
		}
		if ( ! current_user_can( 'edit_pages' ) ) {
			return false;
		}
		return file_exists( JVHE_DIR . 'tests/vhe-tests.js' )
			&& file_exists( JVHE_DIR . 'tests/fixture.html' );
	}

	/**
	 * Find or create the fixture page, always reset it to the fixture HTML,
	 * and make sure we are editing it.
	 */
	public function maybe_enter_test_mode() {
		if ( ! $this->is_test_mode() ) {
			return;
		}

		$fixture_html = file_get_contents( JVHE_DIR . 'tests/fixture.html' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$content      = "<!-- wp:html -->\n" . trim( $fixture_html ) . "\n<!-- /wp:html -->";

		$page = get_page_by_path( self::TEST_FIXTURE_SLUG, OBJECT, 'page' );

		if ( $page ) {
			$fixture_id = (int) $page->ID;
			// Reset to a known state on every test visit (like rebuilding a fixture).
			wp_update_post(
				array(
					'ID'           => $fixture_id,
					'post_content' => $content,
					'post_status'  => 'draft',
				)
			);
		} else {
			$fixture_id = (int) wp_insert_post(
				array(
					'post_title'   => 'VHE Test Fixture (do not edit)',
					'post_name'    => self::TEST_FIXTURE_SLUG,
					'post_type'    => 'page',
					'post_status'  => 'draft',
					'post_content' => $content,
				)
			);
		}

		if ( ! $fixture_id ) {
			return;
		}

		global $pagenow;
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$editing = ( 'post.php' === $pagenow && isset( $_GET['post'] ) && (int) $_GET['post'] === $fixture_id );

		if ( ! $editing ) {
			$url = add_query_arg(
				array(
					'post'     => $fixture_id,
					'action'   => 'edit',
					'vhe-test' => '1',
					// phpcs:ignore WordPress.Security.NonceVerification.Recommended
					'vhecb'    => isset( $_GET['vhecb'] ) ? sanitize_text_field( wp_unslash( $_GET['vhecb'] ) ) : (string) time(),
				),
				admin_url( 'post.php' )
			);
			wp_safe_redirect( $url );
			exit;
		}
	}

	/**
	 * Enqueue the in-browser test suite when in test mode.
	 *
	 * @param string $version Asset version of the main editor script.
	 */
	private function enqueue_test_suite( $version ) {
		if ( ! $this->is_test_mode() ) {
			return;
		}

		$page       = get_page_by_path( self::TEST_FIXTURE_SLUG, OBJECT, 'page' );
		$fixture_id = $page ? (int) $page->ID : 0;
		$test_file  = JVHE_DIR . 'tests/vhe-tests.js';

		wp_enqueue_script(
			'jamies-visual-html-editor-tests',
			JVHE_URL . 'tests/vhe-tests.js',
			array( 'jamies-visual-html-editor', 'wp-data', 'wp-blocks', 'wp-api-fetch', 'wp-element' ),
			(string) filemtime( $test_file ), // Always fresh: cache-busts on every edit of the test file.
			true
		);

		wp_localize_script(
			'jamies-visual-html-editor-tests',
			'VHE_TEST',
			array(
				'fixtureId'     => $fixture_id,
				'fixtureHtml'   => trim( file_get_contents( JVHE_DIR . 'tests/fixture.html' ) ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				'pluginVersion' => $version,
			)
		);
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

		$this->enqueue_test_suite( $asset['version'] );
	}
}
