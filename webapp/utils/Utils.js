sap.ui.define([], function () {
	"use strict";

	return {

		getCustomDataByKey: function (oElement, sKey) {

			var sReturn = undefined;
			var aCustomData = oElement.getCustomData();

			for (var i = 0; i < aCustomData.length; i++) {

				if (aCustomData[i].getKey() === sKey) {
					sReturn = aCustomData[i].getValue();
					return sReturn;
				}
			}
			return sReturn;
		}
	};

});