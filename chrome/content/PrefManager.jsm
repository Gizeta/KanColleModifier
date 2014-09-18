"use strict";

this.EXPORTED_SYMBOLS = ["PrefManager"];

const { classes: Cc, interfaces: Ci } = Components;

this.PrefManager = {
	getPref: function(name, type) {
		let prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.kancollemodifier.");
		if(type == "bool")
			return prefService.getBoolPref(name);
		else if(type == "int")
			return prefService.getIntPref(name);
		else
			return prefService.getCharPref(name);
	},

	setPref: function(name, value) {
		let prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.kancollemodifier.");
		if(typeof value == "boolean")
			prefService.setBoolPref(name, value);
		else if(typeof value == "number")
			prefService.setIntPref(name, value);
		else
			prefService.setCharPref(name, value);
	},

	setDefaultPref: function(name, value) {
		let prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch("extensions.kancollemodifier.");
		if(typeof value == "boolean")
			prefService.setBoolPref(name, value);
		else if(typeof value == "number")
			prefService.setIntPref(name, value);
		else
			prefService.setCharPref(name, value);
	}
};
