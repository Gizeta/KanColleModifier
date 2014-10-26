"use strict";

this.EXPORTED_SYMBOLS = ["KanColleShipInfo"];

const { utils: Cu } = Components;
Cu.import("chrome://kancollemodifier/content/FileManager.jsm");

let shipInfo = function() {
	this.id = 0;
	this.sortno = 0;
	this.name = "";
	this.filename = "";
};

let shipInfoList = null;

this.KanColleShipInfo = {
	getShipInfo: function(id) {
		let count = shipInfoList.length;
		for(let i = 0; i < count; i++) {
			if(shipInfoList[i].id == id) {
				return shipInfoList[i];
			}
		}
		return null;
	},

	getShipInfoBySortno: function(sortno) {
		let count = shipInfoList.length;
		for(let i = 0; i < count; i++) {
			if(shipInfoList[i].sortno == sortno) {
				return shipInfoList[i];
			}
		}
		return null;
	},

	getShipInfoByName: function(name) {
		let count = shipInfoList.length;
		for(let i = 0; i < count; i++) {
			if(shipInfoList[i].name == name) {
				return shipInfoList[i];
			}
		}
		return null;
	},

	getShipInfoByFilename: function(filename) {
		let count = shipInfoList.length;
		for(let i = 0; i < count; i++) {
			if(shipInfoList[i].filename == filename) {
				return shipInfoList[i];
			}
		}
		return null;
	},

	get hasValue() { return shipInfoList.length > 0; },

	update: function(info, graph) {
		shipInfoList = [];
		let count = info.length;
		for(let i = 0; i < count; i++) {
			let si = new shipInfo();
			si.id = info[i].api_id;
			si.sortno = info[i].api_sortno;
			si.name = info[i].api_name;
			si.filename = graph[i].api_filename;
			shipInfoList.push(si);
		}

		FileManager.writeToFile("shipinfo.json", JSON.stringify(shipInfoList));
	},

	init: function() {
		shipInfoList = [];
		return FileManager.readFromFile("shipinfo.json").then(result => {
			if(result != "")
				shipInfoList = JSON.parse(result);
		}, reason => {
			throw new Error(reason);
		});
	},

	dispose: function() {
		shipInfoList = null;
	}
};
