sap.ui.define([], function () {
	"use strict";

	return {

		_getCustomizing: function (oModel) {
			return new Promise(

				function (resolve, reject) {
					this.callFunction("/getCustomizing", {
						success: function (oData, response) {
							resolve(oData);
						},
						error: function (oError) {
							reject(oError);
						}
					});
				}.bind(oModel));
		}
	};

});