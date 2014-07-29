/*
 * TroopJS dom/application/widget
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
define([ "troopjs-dom/component/widget", "when", "jquery"], function FooWidgetModule(Widget, when, jQuery) {
	"use strict";

	var assert = buster.assert;
	var defute = buster.defute;

	/**
	 * A simple widget for test.
	 */
	return Widget.extend(function (element, displayName) {
			assert(element instanceof jQuery);
			assert(displayName, this.displayName);
	}, {
		"displayName" : "test/component/widget/foo",
		"sig/start": function() {
			return when(1).delay(500);
		}
	});
});
