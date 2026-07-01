<?php
/**
 * Plugin Name:       Jamie's Visual HTML Editor
 * Description:       Enhances the core Custom HTML block: paste any HTML, then let editors click directly on text, images, links, and backgrounds to edit them — without touching the markup. Switch between "Edit content" and "Edit code" from the block toolbar, and add Wide/Full width alignment.
 * Version:           0.2
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Jamie Marsland
 * Author URI:        https://profiles.wordpress.org/jamiemarsland/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       jamies-visual-html-editor
 *
 * @package JamiesVisualHtmlEditor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JVHE_VERSION', '0.2' );
define( 'JVHE_FILE', __FILE__ );
define( 'JVHE_DIR', plugin_dir_path( __FILE__ ) );
define( 'JVHE_URL', plugin_dir_url( __FILE__ ) );

require_once JVHE_DIR . 'includes/class-plugin.php';

/**
 * Boot the plugin.
 *
 * @return JVHE_Plugin
 */
function jvhe_init() {
	static $plugin = null;

	if ( null === $plugin ) {
		$plugin = new JVHE_Plugin();
		$plugin->init();
	}

	return $plugin;
}

jvhe_init();
