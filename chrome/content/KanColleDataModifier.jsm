"use strict";

this.EXPORTED_SYMBOLS = ["KanColleDataModifier"];

const { utils: Cu } = Components;
Cu.import("chrome://kancollemodifier/content/FileManager.jsm");
Cu.import("chrome://kancollemodifier/content/PrefManager.jsm");

let data = null;
const shipPrefix = "/kcs/resources/swf/ships/";

this.KanColleDataModifier = {
	get shipData() { return data.ship; },
	set shipData(value) { data.ship = value; },

	validate: function(url) {
		if(!PrefManager.getPref("enable", "bool"))
			return -1;
		let source;
		if(url.indexOf(shipPrefix) >= 0) {
			source = data.ship;
		}
		else {
			source = data.other;
		}

		let count = source.length;
		for(let i = 0; i < count; i++) {
			if(source[i].enable)
				if(url.indexOf(source[i].keyword) >= 0)
					if(FileManager.nativeFileExists(source[i].path))
						return i;
					else
						return -1;
		}
		return -1;
	},

	getData: function(url, index) {
		let source;
		if(url.indexOf(shipPrefix) >= 0) {
			source = data.ship;
		}
		else {
			source = data.other;
		}

		let path = ""
		if(index != null) {
			path = source[index].path;
		}
		else {
			let count = source.length;
			for(let i = 0; i < count; i++) {
				if(url.indexOf(source[i].keyword)) {
					path = source[i].path;
					break;
				}
			}
		}
		return FileManager.readFromNativeFile(path);
	},

	save: function() {
		return FileManager.writeToFile("modify.json", JSON.stringify(data));
	},

	init: function() {
		data = {
			ship: [],
			other: []
		};
		return FileManager.readFromFile("modify.json").then(result => {
			if(result != "")
				data = JSON.parse(result);
		}, reason => {
			throw new Error(reason);
		});
	},

	dispose: function() {
		data = null;
	}
};