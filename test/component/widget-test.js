/*globals buster:false*/
buster.testCase("troopjs-browser/component/widget", function (run) {
	"use strict";

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	require([
		"troopjs-browser/component/widget",
		"text!troopjs-browser/test/component/widget.html",
		"jquery"
	],
		function (Widget, html, $) {

			run({
				"setUp": function () {
					this.$el = $(html).appendTo("body");
					this.timeout = 1000;
				},

				"single widget, no parameter": {
					"weave/unweave": function () {
						var $el = this.$el.filter(".foo");
						return $el.weave().spread(function (widgets) {
							var widget = widgets[0];

							// data-weave attribute is cleared.
							refute.defined($el.attr("data-weave"));
							assert.equals(widget.displayName, "troopjs-browser/test/component/foo");
							assert.equals($el.attr("data-woven"), widget.toString());
							assert.equals(widget.phase, "started");

							return $el.unweave().then(function () {
								refute.defined($el.attr("data-woven"));
								assert.equals($el.attr("data-weave"), "troopjs-browser/test/component/foo");
							});
						});
					}
				},

				"two widgets, one with parameters": {
					"weaving": function () {
						var $el = this.$el.filter(".foobar");
						return $el.weave(456, "def").spread(function (widgets) {
							// Two widgets received.
							var foo = widgets[0];
							var bar = widgets[1];

							// data-weave attribute is cleared.
							refute.defined($el.attr("data-weave"));

							// Two widgets should share the same DOM element.
							assert.same($el.get(0), foo.$element.get(0));
							assert.same($el.get(0), bar.$element.get(0));

							// The woven attribute should consist of two widgets.
							assert.equals([foo.toString(), bar.toString()].join(" "), $el.attr("data-woven"));

							assert.equals(foo.phase, "started");
							assert.equals(bar.phase, "started");

							return $el.unweave().then(function () {
								refute.defined($el.attr("data-woven"));
								assert.equals($el.attr("data-weave"), "troopjs-browser/test/component/foo troopjs-browser/test/component/bar(123, 'abc')");
							});
						});
					}
				},

				"two widgets, with unweave attributes": {
					"weave/unweave": function () {
						var $el = this.$el.filter(".bar");
						return $el.weave(456, "def").spread(function (widgets) {
							var bar = widgets[1];
							return $el.unweave().spread(function (widgets) {
								assert.equals(widgets.length, 1);
								var foo = widgets[0];
								assert.equals(foo.displayName, "troopjs-browser/test/component/foo");
								// "bar" still in data-woven attribute.
								assert.equals($el.attr("data-woven"), bar.toString());
								// data-unweave attribute should be cleared afterward.
								refute.defined($el.attr("data-unweave"));
								assert.equals($el.attr("data-weave"), "troopjs-browser/test/component/foo");
							});
						});
					}
				},

				"dynamic weaving/unweave": {
					"weave/unweave": function () {
						var $el = this.$el.filter(".foobar2");
						return $el.weave().spread(function (widgets) {
							var foo = widgets[0];
							return $el
								.attr("data-weave", "troopjs-browser/test/component/bar(123, 'abc')")
								.weave(456, "def")
								.spread(function (widgets) {

									assert.equals(widgets.length, 1);
									var bar = widgets[0];
									assert.equals(bar.displayName, "troopjs-browser/test/component/bar");

									// data-unweave attribute should be cleared afterward.
									refute.defined($el.attr("data-weave"));
									// "bar" appears in data-woven attribute.
									assert.equals($el.attr("data-woven"), [foo.toString(), bar.toString()].join(" "));

									$el.attr("data-unweave", "troopjs-browser/test/component/bar");

									return $el.unweave().spread(function (unweaved) {
										assert.equals(unweaved.length, 1);

										// data-unweave attribute should be cleared afterward.
										refute.defined($el.attr("data-unweave"));
										assert.equals($el.attr("data-woven"), foo.toString());
									});
								});
						});
					}
				},

				"tearDown": function () {
					this.$el.remove();
				}
			});
		});
});