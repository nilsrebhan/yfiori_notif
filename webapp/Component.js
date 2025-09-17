sap.ui.define([
	"sap/ui/core/Component",
	"sap/m/Button",
	"sap/m/Bar",
	"sap/m/MessageToast",
	"com/pag/flp/notifications/utils/Personalization",
	"com/pag/flp/notifications/utils/Employee",
	"com/pag/flp/notifications/utils/Customizing",
	"com/pag/flp/notifications/utils/Notifications",
	"sap/m/MessageBox",
	"sap/ui/core/message/Message",
	"sap/base/Log",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/pag/flp/notifications/js/NewRelic"
], function (Component, Button, Bar, MessageToast, Personalization, Employee, Customizing, Notifications, MessageBox, Message, Log,
	Sorter, Filter, FilterOperator, NewRelic) {

	return Component.extend("com.pag.flp.notifications.Component", {

		metadata: {
			"manifest": "json"
		},

		init: function () {
			this._getStartUpParameters();
			this._prepareMessageModel();
			this._prepaireoDataModel();
			// Attach Listener to Message Model to open the Message view if needed
			this.getModel().attachBatchRequestCompleted(this._checkRequest.bind(this));

			var rendererPromise = this._getRenderer();
			var pCustomizing = Customizing._getCustomizing(this.getModel());
			var pPersonalization = Personalization._getPersonalization();
			var pEmployeeDetails = Employee._getEmployeeDetails(this.getModel());
			var pNotifications = this._getNotifications();

			Promise.all([pPersonalization, pEmployeeDetails, pCustomizing, pNotifications]).then(function (data) {
				//Default Personalization if not existing
				if (!data[0]) {
					data[0] = {};
				}

				// Set Personalization 
				this.getModel("Personalization").setData(data[0]);

				// Set Employee 
				this.getModel("Employee").setData(data[1]);

				// Set Customizing 
				this.getModel("Customizing").setData(data[2]);

				//open
				if (this._hasOpenNotifications(data[3].results)) {
					this.onOpenNotifications();
				}

				//schedule refresh notifications
				this._scheduleRefreshNotifications(data[2]);

				// mark Icon
				Notifications.markIcon(this.notificationIcon, data[3].results);

			}.bind(this));

			rendererPromise.then(function (oRenderer) {
				this.notificationIcon = oRenderer.addHeaderEndItem("sap.ushell.ui.shell.ShellHeadItem", {
					id: "notificationHeaderBtn",
					icon: "sap-icon://bell",
					text: "Notifications",
					press: function (oEvent) {
						this.onOpenNotifications();
					}.bind(this)
				}, true, false, [sap.ushell.renderers.fiori2.RendererExtensions.LaunchpadState.Home, sap.ushell.renderers.fiori2.RendererExtensions
					.LaunchpadState.App
				]);
			}.bind(this));

		},

		onOpenNotifications: function () {
			if (!this.notificationsPopover) {
				this.notificationsPopover = sap.ui.xmlfragment("com.pag.flp.notifications.view.fragments.NotificationsPopover", this);
				this.notificationsPopover.setModel(this.getModel());
				this.notificationsPopover.setModel(this.getModel("Personalization"), "Personalization");
				this.notificationsPopover.setModel(this.getModel("Employee"), "Employee");
				this.notificationsPopover.setModel(this.getModel("Customizing"), "Customizing");
				this.notificationsPopover.setModel(this.getModel("message"), "message");
				this.notificationsPopover.setModel(this.getModel("i18n"), "i18n");
			}
			this.notificationsPopover.oPopup.setAutoClose(false);
			this.notificationsPopover.addStyleClass("fade-in");
			if (sap.ui.getCore().byId("notificationHeaderBtn").isActive()) {
				this.notificationsPopover.openBy(sap.ui.getCore().byId("notificationHeaderBtn"));
			} else {
				this.notificationsPopover.openBy(sap.ui.getCore().byId("endItemsOverflowBtn"));
			}
			NewRelic.trackNewRelicEvent("ynotif-open", {});
		},
		onCloseNotifications: function () {
			if (this.notificationsPopover) {
				this.notificationsPopover.close();
			}
		},
		onBeforePopoverClose: function (oEvent) {

		},

		_prepaireoDataModel: function () {
			this.getModel().setHeaders({
				"par": this.getModel("Runtime").getProperty("/par").toUpperCase()
			});
			this.getModel().sDefaultUpdateMethod = sap.ui.model.odata.UpdateMethod.Put;

			this.getModel().setSizeLimit(9999);
		},
		_getStartUpParameters: function () {
			try {
				if (this.getComponentData().startupParameters.hasOwnProperty("par")) {
					this.getModel("Runtime").setProperty("/par", this.getComponentData().startupParameters.par[0]);
				} else {
					if (this.getComponentData().config.hasOwnProperty("par")) {
						this.getModel("Runtime").setProperty("/par", this.getComponentData().config.par);
					} else {
						throw new Error();
					}
				}

			} catch (err) {
				MessageBox.error(
					this.getModel("i18n").getProperty("WrongStartUpParameters")
				);
			}
		},

		_getRenderer: function () {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function (oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		},
		_getNotifications: function () {
			return new Promise(

				function (resolve, reject) {
					this.getModel().read("/messageSet", {
						filters: [new Filter("statusId", FilterOperator.EQ, 1)],
						success: function (oData, oResponse) {
							try {
								NewRelic.trackNewRelicEvent("ynotif-initial-count", {
									customCount: oData.results.length
								});
							} catch (err) {}
							
							resolve(oData);

						}.bind(this),
						error: function (error) {
							reject();
						}
					});
				}.bind(this));
		},
		_hasOpenNotifications: function (aNotifications) {

			for (var i = 0; i < aNotifications.length; i++) {
				if (aNotifications[i].statusId === 1) {
					return true;
				}
			}
			return false;
		},
		_prepareMessageModel: function () {

			var oMessageModel = sap.ui.getCore().getMessageManager().getMessageModel();

			sap.ui.getCore().getMessageManager().registerMessageProcessor(this.getModel());

			this.setModel(oMessageModel, "message");
		},
		_checkRequest: function (oEvent) {
			this.parseMessages(oEvent);
			if (this.getModel("message").getData().length > 0) {
				//debugger;
				//sap.ui.core.UIComponent.getRouterFor(this).navTo("Error");
				//this._openErrorMessages();
			}
		},
		parseMessages: function (oEvent) {
			var aRequest = oEvent.getParameter("requests");
			if (aRequest) {
				for (var i = 0; i < aRequest.length; i++) {
					if (aRequest[i].hasOwnProperty("response") && aRequest[i].response.hasOwnProperty("statusCode") && parseInt(aRequest[i].response.statusCode) >
						399) {
						var sMsg = JSON.parse(aRequest[i].response.responseText).error.message.value;
						sap.ui.getCore().getMessageManager().addMessages(new Message({
							message: sMsg,
							type: "Error"
						}));
					}
				}
			}
		},
		_scheduleRefreshNotifications: function (oCustomizing) {
			try {
				if (oCustomizing.hasOwnProperty("refreshTime") && oCustomizing.refreshTime) {
					var iRefreshTime = parseInt(oCustomizing.refreshTime) * 1000;

					setInterval(function () {
						this.refreshNotifications();
					}.bind(this), iRefreshTime);
				}
			} catch (err) {
				// do nothing refresh is disabled
				Log.error("Failed to schedule auto refresh");
			}
		},
		refreshNotifications: function () {
			//this.notificationsPopover.getContent()[0].getContent()[0].getItems()[1].refreshAggregation("items");
			this.getModel().read('/messageSet', {
				sorter: {
					path: 'statusId',
					descending: true
				},
				success: function (oData, response) {
					//MessageToast.show("Die Benachrichtigungen wurden aktualisiert");		
				}
			});

		}

	});
});