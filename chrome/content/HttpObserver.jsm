"use strict";

this.EXPORTED_SYMBOLS = ["HttpObserver"];

const { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components;

Cu.import("resource://gre/modules/LoadContextInfo.jsm");

let callback = [];
let observerService = null;
let modifier = null;
let httpListener = function () {
	this.originalListener = null;
	this.receivedData = [];
};

httpListener.prototype = {
	onDataAvailable: function(request, context, inputStream, offset, count) {
		let binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		let storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
		let binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);

		binaryInputStream.setInputStream(inputStream);
		storageStream.init(8192, count, null);
		binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

		let data = binaryInputStream.readBytes(count);
		this.receivedData.push(data);
		binaryOutputStream.writeBytes(data, count);

		this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
	},

	onStartRequest: function(request, context) {
		this.originalListener.onStartRequest(request, context);
		this.receivedData = [];
	},

	onStopRequest: function(request, context, statusCode) {
		this.originalListener.onStopRequest(request, context, statusCode);

		let responseData = this.receivedData.join('');

		callback.forEach(function(element, index, array) {
			element("response", request.name, responseData);
		});
	},

	QueryInterface: function (aIID) {
		if(aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
			return this;
		}
		throw Cr.NS_NOINTERFACE;
	}
};

let httpModifier = function () {
	this.originalListener = null;
	this.dataIndex = -1;
	this.receivedData = [];
	this.cached = false;
};

httpModifier.prototype = {
	onDataAvailable: function(request, context, inputStream, offset, count) {
		let binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		binaryInputStream.setInputStream(inputStream);
		let data = binaryInputStream.readBytes(count);
		if(!this.cached)
			this.receivedData.push(data);
	},

	onStartRequest: function(request, context) {
		this.originalListener.onStartRequest(request, context);
		this.receivedData = [];
	},

	onStopRequest: function(request, context, statusCode) {
		let storageStream = modifier.getData(request.name, this.dataIndex);
		let inputStream = storageStream.newInputStream(0);

		if(!this.cached) {
			let responseData = this.receivedData.join('');
			let ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
			let uri = ioService.newURI(request.name, null, null);
			let cacheService = Cc["@mozilla.org/netwerk/cache-storage-service;1"].getService(Ci.nsICacheStorageService);
			let storage = cacheService.diskCacheStorage(LoadContextInfo.default, false);
			storage.asyncOpenURI(uri, "", Ci.nsICacheStorage.OPEN_NORMALLY, {
				onCacheEntryCheck: function (entry, appcache) {
					return Ci.nsICacheEntryOpenCallback.ENTRY_WANTED;
				},
				onCacheEntryAvailable: function (entry, isnew, appcache, status) {
					entry.setMetaDataElement("request-method", "GET");
					let binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
					binaryOutputStream.setOutputStream(entry.openOutputStream(0));
					binaryOutputStream.writeBytes(responseData, responseData.length);
				}
			});
		}

		this.originalListener.onDataAvailable(request, context, inputStream, 0, inputStream.available());
		this.originalListener.onStopRequest(request, context, statusCode);
	},

	QueryInterface: function (aIID) {
		if(aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
			return this;
		}
		throw Cr.NS_NOINTERFACE;
	}
};

this.HttpObserver = {
	observe: function(aSubject, aTopic, aData) {
		if(!(aSubject instanceof Ci.nsIHttpChannel))
			return;
		if(aTopic == "http-on-examine-response") {
			let httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
			if(httpChannel.URI.spec.match(/^http.*\/kcsapi\//)) {
				let newListener = new httpListener();
				aSubject.QueryInterface(Ci.nsITraceableChannel);
				newListener.originalListener = aSubject.setNewListener(newListener);
			}
			else if(httpChannel.URI.spec.match(/^http.*\/kcs\//)) {
				let idx = modifier.validate(httpChannel.URI.spec);
				if(idx >= 0) {
					let newListener = new httpModifier();
					newListener.dataIndex = idx;
					aSubject.QueryInterface(Ci.nsITraceableChannel);
					newListener.originalListener = aSubject.setNewListener(newListener);
				}
			}
		}
		else if(aTopic == "http-on-modify-request") {
			let httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
			if(httpChannel.requestMethod == 'POST' && httpChannel.URI.spec.match(/^http.*\/kcsapi\//)) {
				httpChannel.QueryInterface(Ci.nsIUploadChannel);
				let uploadStream = httpChannel.uploadStream;
				uploadStream.QueryInterface(Ci.nsISeekableStream);
				let inputStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci. nsIScriptableInputStream);
				inputStream.init(uploadStream);
				uploadStream.seek(0, 0);
				let n = inputStream.available();
				let postdata = inputStream.read(n);
				uploadStream.seek(0, 0);

				callback.forEach(function(element, index, array) {
					element("request", httpChannel.URI.spec, postdata);
				});
			}
		}
		else if(aTopic == "http-on-examine-cached-response") {
			let httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
			if(httpChannel.URI.spec.match(/^http.*\/kcs\//)) {
				let idx = modifier.validate(httpChannel.URI.spec);
				if(idx >= 0) {
					let newListener = new httpModifier();
					newListener.dataIndex = idx;
					newListener.cached = true;
					aSubject.QueryInterface(Ci.nsITraceableChannel);
					newListener.originalListener = aSubject.setNewListener(newListener);
				}
			}
		}
		else if(aTopic == "http-on-examine-merged-response") {
			let httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
			if(httpChannel.URI.spec.match(/^http.*\/kcs\//)) {
				let idx = modifier.validate(httpChannel.URI.spec);
				if(idx >= 0) {
					let newListener = new httpModifier();
					newListener.dataIndex = idx;
					aSubject.QueryInterface(Ci.nsITraceableChannel);
					newListener.originalListener = aSubject.setNewListener(newListener);
				}
			}
		}
	},

	QueryInterface: function(aIID) {
		if(aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsISupports)) {
			return this;
		}
		throw Cr.NS_NOINTERFACE;
	},

	addCallback: function(f) {
		if(typeof(f) == 'function') {
			callback.push(f);
		}
	},

	removeCallback: function(f) {
		let count = callback.length;
		for(let i = 0; i < count; i++) {
			if(callback[i] == f) {
				callback.splice(i, 1);
				return;
			}
		}
	},

	registerModifier: function(valid, getd) {
		modifier = {
			validate: valid,
			getData: getd
		};
	},

	unregisterModifer: function() {
		modifier = null;
	},

	init: function() {
		observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		observerService.addObserver(this, "http-on-examine-response", false);
		observerService.addObserver(this, "http-on-modify-request", false);
		observerService.addObserver(this, "http-on-examine-cached-response", false);
		observerService.addObserver(this, "http-on-examine-merged-response", false);
		modifier = null;
	},

	dispose: function() {
		observerService.removeObserver(this, "http-on-examine-response", false);
		observerService.removeObserver(this, "http-on-modify-request", false);
		observerService.removeObserver(this, "http-on-examine-cached-response", false);
		observerService.removeObserver(this, "http-on-examine-merged-response", false);
		callback = [];
		observerService = null;
		modifier = null;
	}
};