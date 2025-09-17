sap.ui.define([], function () {
	"use strict";

	return {

		markIcon : function(oIcon, aNotifications){
			var count = 0;
			
			for (var i=0; i<aNotifications.length; i++) {
				if(aNotifications[i].statusId === 1){
					count = count + 1;
				}
			}
			oIcon.setFloatingNumber(count);
		},
	};

});