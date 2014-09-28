/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./config",
	"require",
	"when",
	"jquery",
	"troopjs-util/getargs",
	"poly/array"
], function WeaveModule(config, parentRequire, when, $, getargs) {
	"use strict";

	/**
	 * @class dom.loom.weave
	 * @mixin dom.loom.config
	 * @mixin Function
	 * @static
	 */

	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var MODULE = "module";
	var WEAVE = "weave";
	var WOVEN = "woven";
	var LENGTH = "length";
	var $WARP = config["$warp"];
	var $WEFT = config["$weft"];
	var ATTR_WEAVE = config[WEAVE];
	var ATTR_WOVEN = config[WOVEN];
	var RE_SEPARATOR = /[\s,]+/;

	/**
	 * Instantiate all {@link dom.component.widget widgets}  specified in the {@link dom.loom.config#weave weave attribute}
	 * of this element, and to signal the widget for start with the arguments.
	 *
	 * The weaving will result in:
	 *
	 *  - Updates the {@link dom.loom.config#weave woven attribute} with the created widget instances names.
	 *  - The {@link dom.loom.config#$warp $warp data property} will reference the widget instances.
	 *
	 * @localdoc
	 *
	 * It also lives as a jquery plugin as {@link $#method-weave}.
	 *
	 * **Note:** It's not commonly to use this method directly, use instead {@link $#method-weave jQuery.fn.weave}.
	 *
	 * 	// Create element for weaving
	 * 	var $el = $('<div data-weave="my/widget(option)"></div>')
	 * 	// Populate `data`
	 * 	.data("option",{"foo":"bar"})
	 * 	// Instantiate the widget defined in "my/widget" module, with one param read from the element's custom data.
	 * 	.weave();
	 *
	 * @method constructor
	 * @param {...*} [start_args] Arguments that will be passed to each widget's {@link dom.component.widget#start start} method
	 * @return {Promise} Promise for the completion of weaving all widgets.
	 */
	return function weave() {
		// Store start_args for later
		var start_args = arguments;
		/**
		 * Weaves `$element`
		 * @param {jQuery} $element
		 * @param {String} weave_attr
		 * @return {Promise}
		 * @private
		 */
		var $weave = function ($element, weave_attr) {
			/**
			 * Maps `value` to `$data[value]`
			 * @param {*} value
			 * @return {*}
			 * @private
			 */
			var $map = function (value) {
				return $data.hasOwnProperty(value)
					? $data[value]
					: value;
			};
			// Let `$data` be `$element.data()`
			var $data = $element.data();
			// Let `weave_re` be scoped locally since we use the `g` flag
			var weave_re = /[\s,]*(((?:\w+!)?([\w\d_\/\.\-]+)(?:#[^(\s]+)?)(?:\(([^\)]+)\))?)/g;
			// Let `weave_args` be `[]`
			var weave_args = [];
			var weave_arg;
			var weave_arg_add;
			var matches;

			// Iterate `weave_attr` (while `weave_re` matches)
			// matches[1] : full widget module name (could be loaded from plugin) - "mv!widget/name#1.x(1, 'string', false)"
			// matches[2] : widget name and arguments - "widget/name(1, 'string', false)"
			// matches[3] : widget name - "widget/name"
			// matches[4] : widget arguments - "1, 'string', false"
			while ((matches = weave_re.exec(weave_attr)) !== NULL) {
				// Let `weave_arg` be [ $element, widget display name ].
				weave_arg = [ $element, matches[3]];
				// Let `weave_arg[WEAVE]` be `matches[1]`
				weave_arg[WEAVE] = matches[1];
				// Let `weave_arg[MODULE]` be `matches[3]`
				weave_arg[MODULE] = matches[3];
				// If there were additional arguments ...
				if ((weave_arg_add = matches[4]) !== UNDEFINED) {
					// .. parse them using `getargs`, `.map` the values with `$map` and push to `weave_arg`
					ARRAY_PUSH.apply(weave_arg, getargs.call(weave_arg_add).map($map));
				}
				// Push `weave_arg` on `weave_args`
				weave_args.push(weave_arg);
			}

			return when
				// Map `weave_args` (async)
				.map(weave_args, function (args) {
					// Let `deferred` be `when.defer()`
					var deferred = when.defer();

					// Extract `resolve`, `reject` from `deferred`
					var resolve = deferred.resolve;
					var reject = deferred.reject;

					// Require `weave_arg[MODULE]`
					parentRequire([ args[MODULE] ], function (Widget) {
						var widget;
						var $deferred;

						// Create widget instance
						widget = Widget.apply(Widget, args);

						if (widget.trigger) {
							// Let `$deferred` be `$.Deferred()`
							$deferred = $.Deferred();

							// Get trusted promise
							when($deferred)
								// Yield
								.yield(widget)
								// Link
								.then(resolve, reject);

							// Start widget
							widget.start.call(widget, $deferred);
						}
						else {
							// Start widget
							widget.start.apply(widget, start_args)
								// Yield
								.yield(widget)
								// Link
								.then(resolve, reject);
						}
					}, reject);

					// Return `deferred.promise`
					return deferred.promise;
				})
				.tap(function (widgets) {
					// Map `Widget[]` to `String[]`
					var woven = widgets.map(function (widget) {
						return widget.toString();
					});

					// Update `$element` attribute `ATTR_WOVEN`
					$element.attr(ATTR_WOVEN, function (index, attr) {
						attr = (attr === UNDEFINED ? ARRAY_PROTO : attr.split(RE_SEPARATOR))
							.concat(woven)
							.join(" ");

						return attr || NULL;
					});
				});
		};

		return when.all(ARRAY_MAP.call(this, function (element) {
			// Let `$element` be `element` wrapped in `$`
			var $element = $(element);
			// Let `weave_attr` be `$element.attr(ATTR_WEAVE)` or `""`
			var weave_attr = $element.attr(ATTR_WEAVE) || "";
			// Make sure to remove ATTR_WEAVE asap in case someone else tries to `weave` again
			$element.removeAttr(ATTR_WEAVE);
			// Attempt weave
			return when.attempt($weave, $element, weave_attr);
		}));
	}
});
