sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/core/message/Message",
	"com/pag/flp/notifications/utils/Utils",
	"sap/base/Log",
	"sap/m/MessageBox",
	"com/pag/flp/notifications/utils/Notifications",
	"sap/ui/core/Fragment"
], function (Controller, Filter, FilterOperator, MessageToast, Message, Utils, Log, MessageBox, Notifications, Fragment) {
	"use strict";

	return Controller.extend("com.pag.flp.notifications.controller.Popover", {

		onInit: function () {

		},
		onBeforeRendering: function () {

		},
		onAfterRendering: function () {

		},
		onNotificationListUpdateStarted: function (oEvent) {
			if (oEvent.getSource().getBinding("items").aFilters.length === 0) {
				var aFilters = oEvent.getSource().getBinding("items").aFilters;

				aFilters.push(new Filter("statusId", FilterOperator.EQ, 1));

				oEvent.getSource().getBinding("items").filter(aFilters);
			}
		},
		onNotificationListUpdateFinished: function (oEvent) {
			var oBtn = sap.ui.getCore().byId("notificationHeaderBtn");

			var aListItems = oEvent.getSource().getItems();
			var aData = [];

			for (var i = 0; i < aListItems.length; i++) {
				aData.push(aListItems[i].getBindingContext().getObject());
			}
			Notifications.markIcon(oBtn, aData);
		},
		onNotificationListDataRequested: function (oEvent) {
			if (oEvent.getSource().aFilters.length === 0) {
				var aFilters = oEvent.getSource().aFilters;

				aFilters.push(new Filter("statusId", FilterOperator.EQ, 1));

				oEvent.getSource().filter(aFilters);
			}
		},

		onChangeNotificationStatus: function (oEvent, iStatus) {

			//this.getView().getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/statusId", iStatus);
			var oData = oEvent.getSource().getBindingContext().getObject();
			oData.statusId = iStatus;
			this._updateNotification(oEvent.getSource().getBindingContext().getPath(), oData).then(function (data) {
				//Success
			}.bind(this), function (error) {
				// error
				MessageBox.error(error.message);
			}.bind(this));
		},
		onNotificationPress: function (oEvent) {

		},
		onSwipeNotification: function (oEvent) {

		},
		_updateNotification: function (path, data) {
			var _path = path;
			var _data = data;
			delete _data.toActionSet;
			return new Promise(
				function (resolve, reject) {
					this.getView().getModel().update(_path, _data, {
						success: function (oData, oResponse) {
							resolve(oData);
							//Notifications.markIcon();          
							//this.getView().getParent().openBy(sap.ui.getCore().byId("notificationHeaderBtn"));
							//this._checkRequest();
						}.bind(this),
						error: function (error) {
							reject(error);
						}
					});
				}.bind(this));
			return new Promise();
		},
		onMarkAllAsRead: function (oEvent) {
			var aItems = this.getView().byId("notificationList").getItems();

			for (var i = 0; i < aItems.length; i++) {
				this.getView().getModel().setProperty(aItems[i].getBindingContext().getPath() + "/statusId", 2);
				//var oData = aItems[i].getBindingContext().getObject();

				/*this._updateNotification(aItems[i].getBindingContext().getPath(), oData).then(function (data) {
					//Success
				}.bind(this), function (error) {
					// error
					MessageBox.error(error.message);
				}.bind(this));*/
			}
			this.getView().getModel().submitChanges({
				success: function (data, response) {

				}.bind(this),
				error: function (error) {

				}
			});
			//MessageToast.show("Mark " + aItems.length + " notifications as read");
		},
		//Action Button pressed
		onExecuteAction: function (oEvent, context) {
			// context = send oder action - describes to source (action btn pressed = action, send btn (comment) pressed = send)
			var hasComment = oEvent.getSource().getBindingContext().getProperty("hasComment");

			// Comment Field is not supported for the time being
			hasComment = false;

			// Btn with comment pressed => open comment field
			if (hasComment && context === 'action') {
				oEvent.getSource().getParent().getParent().getParent().getItems()[1].getItems()[0].setVisible(true);
			}
			// Btn with comment pressed and after send btn was pressed => execute the exction
			if (context === 'send') {
				this._onExecuteAction(oEvent);
			}
			//Action Btn was pressed without comment 
			if (!hasComment && context === 'action') {
				this._onExecuteAction(oEvent);
			}

		},
		_openComment: function (oEvent) {
			var oButton = oEvent.getSource();

			// create popover
			if (!this._oPopover) {
				Fragment.load({
					name: "com.pag.flp.notifications.view.fragments.CommentPopover",
					controller: this
				}).then(function (pPopover) {
					this._oPopover = pPopover;
					this.getView().addDependent(this._oPopover);
					this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover.openBy(oButton);
			}
		},
		onCancelComment: function (oEvent) {
			oEvent.getSource().getParent().getParent().setVisible(false);
			// Clear Text Area
			oEvent.getSource().getParent().getParent().getItems()[0].setValue("");
		},
		_onExecuteAction: function (oEvent) {

			if (oEvent.getSource().getBindingContext().getProperty("type") === 1) { // Action Type FE Navigation
				this._onExecuteActionFrontend(oEvent);
			}

			if (oEvent.getSource().getBindingContext().getProperty("type") === 2) {
				this._onExecuteActionBackend(oEvent);
			}

			if (oEvent.getSource().getBindingContext().getProperty("type") === 3) {
				this._onExecuteActionFrontend(oEvent);
				this._onExecuteActionBackend(oEvent);
			}

		},
		_onExecuteActionFrontend: function (oEvent) {
			var xnavservice = sap.ushell.Container.getService("CrossApplicationNavigation");
			xnavservice.toExternal({
				target: {
					shellHash: oEvent.getSource().getBindingContext().getProperty("navigationHash")
				}
			});
		},
		_onExecuteActionBackend: function (oEvent) {
			var oAction = oEvent.getSource().getBindingContext().getObject();
			var oItem = oEvent.getSource().getParent().getBindingContext().getObject();
			var oData = {
				actionId: oAction.id,
				comment: "'test'",
				employeeId: oItem.employeeId,
				messageId: oItem.id

			};
			this._executeAction(oData).then(function (oData) {
				this.getView().byId("notificationList").refreshItems();
			}.bind(this), function (error) {
				Log.error(error);
				MessageBox.error(error.message);
			}.bind(this));
		},
		onChangeStatusFilter: function (oEvent) {
			var sSelectedKey = oEvent.getSource().getSelectedKey();
			var oBinding = this.getView().byId("notificationList").getBinding("items");
			oBinding.aFilters = null;
			var aFilters = [];
			if (sSelectedKey === "0") { //neuste
				aFilters.push(new Filter("statusId", FilterOperator.EQ, 1));
			} else { //ausgeblendete
				aFilters.push(new Filter("statusId", FilterOperator.EQ, 2));
			}
			oBinding.filter(aFilters);
		},
		onCloseNotificationsPopover: function (oEvent) {
			var oPopover = oEvent.getSource().getParent().getParent().getParent().getParent().getParent();
			//oPopover.close();
			oPopover.toggleStyleClass("fade-in");
			oPopover.toggleStyleClass("fadeOutRight");
			setTimeout(
				function () {
					this.close();
					this.toggleStyleClass("fadeOutRight");
				}.bind(oPopover), 250);
		},
		_executeAction: function (data) {
			var _data = data;
			return new Promise(
				function (resolve, reject) {
					this.getView().getModel().callFunction("/executeAction", {
						urlParameters: _data,
						success: function (oData, oResponse) {
							if (oData.executeAction.success) {
								resolve(oData);
							} else {
								reject(new Error(oData.executeAction.message));
							}
						}.bind(this),
						error: function (error) {
							reject(error);
						}
					});
				}.bind(this));

		},

	});
});