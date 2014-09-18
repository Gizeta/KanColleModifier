"use strict";

const { utils: Cu, classes: Cc, interfaces: Ci } = Components;

Cu.import("chrome://kancollemodifier/content/FileManager.jsm");
Cu.import("chrome://kancollemodifier/content/KanColleDataModifier.jsm");
Cu.import("chrome://kancollemodifier/content/KanColleShipInfo.jsm");

let strBundle;

function updateModDelBtnStatus() {
	let delbtn = document.getElementById("pref-delbtn");
	let dataTree = document.getElementById("pref-tree");
	delbtn.disabled = dataTree.view.selection.count < 1;
}

function addModDataItem() {
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, strBundle.getString("kancollemodifier.filepicker.title"), nsIFilePicker.modeOpenMultiple);
	fp.appendFilter(strBundle.getString("kancollemodifier.filepicker.filter"), "*.swf");
	
	let rv = fp.show();
	if(rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
		let files = fp.files;
		let count = 0;
		while(files.hasMoreElements()) {
			let f = files.getNext().QueryInterface(Ci.nsIFile);
			let filename;
			if(f.leafName.indexOf(".hack.swf") >= 0) {
				filename = f.leafName.substr(0, f.leafName.length - 9);
			}
			else {
				filename = f.leafName.substr(0, f.leafName.length - 4);
			}
			let si = KanColleShipInfo.getShipInfoByFilename(filename);
			if(si != null) {
				table.push({
					modid: si.id.toString(),
					modname: si.name,
					modfile: f.path,
					modenable: "true"
				});
			}
			else {
				table.push({
					modid: "[!]",
					modname: "[!]",
					modfile: f.path,
					modenable: "false"
				});
			}
			count++;
		}
		treeBox.rowCountChanged(tree.view.rowCount , count);
	}
}

function deleteModDataItem() {
	let rangeCount = tree.view.selection.getRangeCount();
	let startRec = [];
	let countRec = [];
	let start = {};
	let end = {};
	for(let i = 0; i < rangeCount; i++) {
		tree.view.selection.getRangeAt(i, start, end);
		startRec.push(start.value);
		countRec.push(end.value - start.value + 1);
		
	}
	for(let i = 0; i < rangeCount; i++) {
		table.splice(startRec[i], countRec[i]);
		treeBox.rowCountChanged(startRec[i], -countRec[i]);
	}
}

let table = null;
let data = null;
let tree = null;
let treeBox = null;

function treeView(table) {
	this.rowCount = table.length;
	this.getCellText = function(row, col) {
		return table[row][col.id];
	};
	this.getCellValue = function(row, col) {
		return table[row][col.id];
	};
	this.setTree = function(treebox) {
		this.treebox = treebox;
		treeBox = treebox;
	};
	this.isEditable = function(row, col) {
		return col.editable;
	};
	this.setCellText = function(row, col, value) {
		if(col.id == "modid") {
			let si = KanColleShipInfo.getShipInfo(parseInt(value));
			if(si == null) {
				table[row][col.id] = "[!]" + value;
			}
			else {
				table[row][col.id] = value;
				table[row]["modname"] = si.name;
			}
		}
		else if(col.id == "modname") {
			let si;
			if(value.indexOf("j") == 0) {
				si = KanColleShipInfo.getShipInfoBySortno(parseInt(value.substring(1)));
			}
			else
				si = KanColleShipInfo.getShipInfoByName(value);
			if(si == null) {
				table[row][col.id] = "[!]" + value;
			}
			else {
				table[row][col.id] = value;
				table[row]["modid"] = si.id.toString();
			}
		}
		else table[row][col.id] = value;
	};
	this.setCellValue = function(row, col, value) {
		table[row][col.id] = value;
	};
	this.isContainer = function(row){ return false; };
	this.isSeparator = function(row){ return false; };
	this.isSorted = function(){ return false; };
	this.getLevel = function(row){ return 0; };
	this.getImageSrc = function(row,col){ return null; };
	this.getRowProperties = function(row,props){};
	this.getCellProperties = function(row,col,props){};
	this.getColumnProperties = function(colid,col,props){};
	this.cycleHeader = function(col, elem) {};
}

function init() {
	tree = document.getElementById("pref-tree");
	data = KanColleDataModifier.shipData;
	table = [];
	data.forEach(function(element) {
		if(element.path.indexOf("[!]") == 0) {
			element.path = element.path.substring(3);
		}
		let fi = FileManager.getNativeFileInfo(element.path);
		if(!fi.exists) {
			element.enable = false;
			element.path = "[!]" + element.path;
		}

		table.push({
			modid: element.id.toString(),
			modname: element.name,
			modfile: element.path,
			modenable: element.enable.toString()
		});
	});
	tree.view = new treeView(table);

	strBundle = document.getElementById("pref-bundle");
	if(!KanColleShipInfo.hasValue) {
		document.getElementById("pref-error").innerHTML = strBundle.getString("kancollemodifier.error.nodata");
	}
}

function dispose() {
	table = null;
	data = null;
	tree = null;
	treeBox = null;
}

function save() {
	data = [];
	table.forEach(function(element) {
		let item = {};

		if(element.modfile.indexOf("[!]") == 0) {
			element.modfile = element.modfile.substring(3);
		}

		let fi = FileManager.getNativeFileInfo(element.modfile);
		if(fi.exists) {
			item.enable = element.modenable != "false";
			item.path = element.modfile;

			if(element.modid.indexOf("[!]") == 0) {
				if(element.modname.indexOf("[!]") == 0) {
					item.id = element.modid;
					item.name = element.modname;
					item.keyword = "";
					item.enable = false;
				}
				else {
					let si = KanColleShipInfo.getShipInfoByName(element.modname);
					item.id = si.id;
					item.name = si.name;
					item.keyword = si.filename;
				}
			}
			else {
				if(element.modname.indexOf("[!]") == 0) {
					let id = parseInt(element.modid);
					let si = KanColleShipInfo.getShipInfo(id);
					item.id = si.id;
					item.name = si.name;
					item.keyword = si.filename;
				}
				else {
					let id = parseInt(element.modid);
					let si = KanColleShipInfo.getShipInfo(id);
					item.id = si.id;
					item.name = si.name;
					item.keyword = si.filename;
				}
			}
		}
		else {
			item.enable = false;
			item.path = "[!]" + element.modfile;
			item.id = element.modid;
			item.name = element.modname;
			item.keyword = "";
		}

		data.push(item);
	});

	KanColleDataModifier.shipData = data;
	KanColleDataModifier.save();

	dispose();
}