"use strict";

const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

function startup(data, reason) {
	Cu.import("chrome://kancollemodifier/content/KanColleApiHelper.jsm");
	Cu.import("chrome://kancollemodifier/content/PrefManager.jsm");
	KanColleApiHelper.init();
	PrefManager.setDefaultPref("enable", true);
}

function shutdown(data, reason) {
	if(reason == APP_SHUTDOWN) return;

	KanColleApiHelper.dispose();
	
	Cu.unload("chrome://kancollemodifier/content/FileManager.jsm");
	Cu.unload("chrome://kancollemodifier/content/PrefManager.jsm");
	Cu.unload("chrome://kancollemodifier/content/HttpObserver.jsm");
	Cu.unload("chrome://kancollemodifier/content/KanColleDataModifier.jsm");
	Cu.unload("chrome://kancollemodifier/content/KanColleShipInfo.jsm");
	Cu.unload("chrome://kancollemodifier/content/KanColleApiHelper.jsm");
}

function install(data, reason) {
}

function uninstall(data, reason) {
}