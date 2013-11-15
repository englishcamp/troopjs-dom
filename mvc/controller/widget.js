/**
 * TroopJS browser/mvc/controller/widget module
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
define([
	"../../hash/widget",
	"poly/object",
	"poly/array"
], function (Widget) {
	"use strict";

	var CACHE = "_cache";
	var DISPLAYNAME = "displayName";
	var ARRAY_SLICE = Array.prototype.slice;
	var COUNT = 0;

	function extend() {
		var me = this;

		ARRAY_SLICE.call(arguments).forEach(function (arg) {
			Object.keys(arg).forEach(function (key) {
				me[key] = arg[key];
			});
		});

		return me;
	}

	function handleRequests(requests) {
		var me = this;
		var displayName = me[DISPLAYNAME];

		return me.task(function (resolve, reject) {
			// Track COUNT
			var count = ++COUNT;

			me.request(extend.call({}, me[CACHE], requests))
				.then(function (results) {
					// Get old cache
					var cache = me[CACHE];

					// Calculate updates
					var updates = {};
					var updated = Object.keys(results).reduce(function (update, key) {
						if (!me.equals(cache[key], results[key])) {
							updates[key] = results[key];
							update = true;
						}

						return update;
					}, false);

					// Update cache
					me[CACHE] = results;

					// Reject if this is not the last count, otherwise resolve with results
					if (count !== COUNT){
						reject(results);
					}
					else {
						resolve(me.publish(displayName + "/results", results)
							.then(function () {
								return updated && me.publish(displayName + "/updates", updates);
							})
							.then(function () {
								// Trigger `hashset`
								me.$element.trigger("hashset", [ me.data2uri(results) ]);
							})
							.yield(results));
					}
				});
		});
	}

	return Widget.extend(function () {
		this[CACHE] = {};
	}, {
		"displayName": "browser/mvc/controller/widget",

		"sig/initialize": function () {
			var me = this;

			me.subscribe(me[DISPLAYNAME] + "/requests", handleRequests);
		},

		"sig/finalize": function () {
			var me = this;

			me.unsubscribe(me[DISPLAYNAME]+ "/requests", handleRequests);
		},

		"dom/urichange": function ($event, uri) {
			var me = this;

			me.publish(me[DISPLAYNAME] + "/requests", me.uri2data(uri));
		},

		"request" : function (/* requests */) {
			throw new Error("request is not implemented");
		},

		"uri2data" : function (/* uri */) {
			throw new Error("uri2data is not implemented");
		},

		"data2uri" : function (/* data */) {
			throw new Error("data2uri is not implemented");
		},

		"equals" : function (a, b) {
			return a && b && a === b;
		}
	});
});