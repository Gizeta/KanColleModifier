"use strict";

this.EXPORTED_SYMBOLS = ["KanColleApiHelper"];

const { utils: Cu } = Components;

Cu.import("chrome://kancollemodifier/content/HttpObserver.jsm");
Cu.import("chrome://kancollemodifier/content/KanColleShipInfo.jsm");
Cu.import("chrome://kancollemodifier/content/KanColleDataModifier.jsm");

let hasInitialized = false;

function dealApiData(method, url, content) {
	if(method == "response") {
		let apiResult = JSON.parse(content.substring(content.indexOf('svdata=') + 7));

		if(apiResult.api_result != 1) {
			return;
		}
		let data = apiResult.api_data;
		if(url.indexOf("/kcsapi/api_start2") >= 0) {
			KanColleShipInfo.update(data.api_mst_ship, data.api_mst_shipgraph);
		}
	}
	else if(method == "request") {
	}
}

this.KanColleApiHelper = {
	init: function() {
		if(!hasInitialized) {
			hasInitialized = true;

			HttpObserver.init();
			KanColleDataModifier.init();
			KanColleShipInfo.init();

			HttpObserver.addCallback(dealApiData);
			HttpObserver.registerModifier(KanColleDataModifier.validate, KanColleDataModifier.getData);
		}
	},

	dispose: function() {
		if(hasInitialized) {
			hasInitialized = false;
			HttpObserver.dispose();
			KanColleDataModifier.dispose();
			KanColleShipInfo.dispose();
		}
	}
};