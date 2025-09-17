/* 
	global newrelic:true 
*/

sap.ui.define([

], function () {
	"use strict";

	return {
		getNewRelic: function () {
			var n = undefined;
			if (window.hasOwnProperty("newrelic")) {
				n = window.newrelic;
			} else {
				if (window.parent.hasOwnProperty("newrelic")) {
					n = window.parent.newrelic;
				}
			}
			return n;
		},
		isActive: function () {
			var result = false;

			if (typeof this.getNewRelic() == "object") {
				result = true;
			}
			return result;
		},
		
		trackNewRelicEvent: function (sEvent, oData) {
			try {
				var n = this.getNewRelic();
				if (typeof n == 'object') {
					n.addPageAction(sEvent, oData);
				}
			} catch (err) {}
		},
	};
});