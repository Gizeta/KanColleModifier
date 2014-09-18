"use strict";

this.EXPORTED_SYMBOLS = ["FileManager"];

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/osfile.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

this.FileManager = {
	nativeFileExists: function(path) {
		let file = new FileUtils.File(path);
		return file.exists();
	},

	getNativeFileInfo: function(path) {
		let file = new FileUtils.File(path);
		return {
			exists: file.exists(),
			filename: file.leafName
		};
	},

	readFromNativeFile: function(path) {
		let file = new FileUtils.File(path);
		let inputStream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
		let binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		let storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
		let binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);

		inputStream.init(file, -1, -1, false);
		binaryInputStream.setInputStream(inputStream);

		let count = binaryInputStream.available();
		storageStream.init(8192, count, null);
		binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

		let data = binaryInputStream.readBytes(count);
		binaryOutputStream.writeBytes(data, count);

		return storageStream;
	},

	readFromFile: function(filename) {
		let path = OS.Path.join(OS.Constants.Path.profileDir, "kancollemodifier", filename);
		let decoder = new TextDecoder();
		return Task.spawn(function* () {
			yield OS.File.makeDir(OS.Path.join(OS.Constants.Path.profileDir, "kancollemodifier"), { ignoreExisting: true });
			let exists = yield OS.File.exists(path);
			let file = yield OS.File.open(path, { read: true, truncate: !exists });
			let array = yield file.read();
			let content = decoder.decode(array);
			yield file.close();
			return content;
		});
	},

	writeToFile: function(filename, content) {
		let path = OS.Path.join(OS.Constants.Path.profileDir, "kancollemodifier", filename);
		let encoder = new TextEncoder();
		let array = encoder.encode(content);
		return Task.spawn(function* () {
			yield OS.File.makeDir(OS.Path.join(OS.Constants.Path.profileDir, "kancollemodifier"), { ignoreExisting: true });
			yield OS.File.writeAtomic(path, array, { encoding: "utf-8" });
		});
	},

	appendToFile: function(filename, content) {
		let path = OS.Path.join(OS.Constants.Path.profileDir, "kancollemodifier", filename);
		let encoder = new TextEncoder();
		let array = encoder.encode(content);
		return Task.spawn(function* () {
			let exists = yield OS.File.exists(path);
			let file = yield OS.File.open(path, { write: true, append: true });
			yield file.write(array);
			yield file.close();
		});
	}
};
