sap.ui.define([], function () {
	"use strict";

	return {

		_getPersonalization: function () {
			return new Promise(

				function (resolve, reject) {
					var oPers = sap.ushell.Container.getService("Personalization");
					var sContainer = "com.pag.flp.notifications";

					oPers.getContainer(sContainer).then(function (oContainer) {

						resolve(oContainer.getItemValue("settings"));

					}.bind(this));
				}.bind(this));
		},
		setConfiguration: function (oConfiguration) {
			return new Promise(

				function (resolve, reject) {
					var oPers = sap.ushell.Container.getService("Personalization");
					var sContainer = "com.pag.flp.notifications";

					oPers.getContainer(sContainer).then(function (oContainer) {

						oContainer.setItemValue("settings", JSON.stringify(oConfiguration));
						oContainer.save().then(function (o) {
							resolve();
						}.bind(this), function (e) {
							reject();
						});

					}.bind(this));
				}.bind(this));
		},
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