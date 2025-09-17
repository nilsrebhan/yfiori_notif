sap.ui.define([], function () {
	"use strict";

	return {

		_getEmployeeDetails: function (oModel) {
			return new Promise(

				function (resolve, reject) {
					this.callFunction("/whoAmI", {
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