"use strict";

this.EXPORTED_SYMBOLS = ["KanColleShipInfo"];

const { utils: Cu } = Components;
Cu.import("chrome://kancollemodifier/content/FileManager.jsm");

let shipInfo = function() {
	this.id = 0;
	this.sortno = 0;
	this.name = "";
	this.filename = "";
	this.boko_n = [0, 0];
	this.boko_d = [0, 0];
	this.kaisyu_n = [0, 0];
	this.kaisyu_d = [0, 0];
	this.kaizo_n = [0, 0];
	this.kaizo_d = [0, 0];
	this.map_n = [0, 0];
	this.map_d = [0, 0];
	this.ensyuf_n = [0, 0];
	this.ensyuf_d = [0, 0];
	this.ensyue_n = [0, 0];
	this.battle_n = [0, 0];
	this.battle_d = [0, 0];
	this.weda = [0, 0];
	this.wedb = [0, 0];
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
		let count = info.length;
		for(let i = 0; i < count; i++) {
			let si = new shipInfo();
			si.id = info[i].api_id;
			si.sortno = info[i].api_sortno;
			si.name = info[i].api_name;
			si.filename = graph[i].api_filename;
			si.boko_n = graph[i].api_boko_n;
			si.boko_d = graph[i].api_boko_d;
			si.kaisyu_n = graph[i].api_kaisyu_n;
			si.kaisyu_d = graph[i].api_kaisyu_d;
			si.kaizo_n = graph[i].api_kaizo_n;
			si.kaizo_d = graph[i].api_kaizo_d;
			si.map_n = graph[i].api_map_n;
			si.map_d = graph[i].api_map_d;
			si.ensyuf_n = graph[i].api_ensyuf_n;
			si.ensyuf_d = graph[i].api_ensyuf_d;
			si.ensyue_n = graph[i].api_ensyue_n;
			si.battle_n = graph[i].api_battle_n;
			si.battle_d = graph[i].api_battle_d;
			si.weda = graph[i].api_weda;
			si.wedb = graph[i].api_wedb;
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
