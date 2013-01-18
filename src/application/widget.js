/**
 * TroopJS browser/application/widget
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "module", "../component/widget", "when" ], function ApplicationWidgetModule(module, Widget, when) {
	/*jshint laxbreak:true */

	var CHILDREN = "children";
	var ARRAY_SLICE = Array.prototype.slice;

	function forward(signal) {
		var self = this;
		var args = arguments;
		var children = self[CHILDREN];
		var length = children ? children.length : 0;
		var index = 0;

		function next(_args) {
			args = _args || args;

			return length > index
				? when(children[index++].signal(signal), next)
				: when.resolve(args);
		}

		return next();
	}

	return Widget.extend(function ApplicationWidget($element, name, children) {
		this[CHILDREN] = children;
	}, {
		"displayName" : "browser/application/widget",

		"sig/initialize" : forward,
		"sig/start" : function start() {
			var self = this;
			var _weave = self.weave;
			var args = arguments;

			return forward.apply(self, args).then(function started() {
				return _weave.apply(self, ARRAY_SLICE.call(args, 1));
			});
		},
		"sig/stop" : function stop() {
			var self = this;
			var _unweave = self.unweave;
			var args = arguments;

			return _unweave.apply(self, ARRAY_SLICE.call(args, 1)).then(function stopped() {
				return forward.apply(self, args);
			});
		},
		"sig/finalize" : forward
	});
});