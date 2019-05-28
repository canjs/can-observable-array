const canReflect = require("can-reflect");
const computedHelpers = require("./computed-helpers");
const mapBindings = require("can-event-queue/map/map");
const ObservationRecorder = require("can-observation-recorder");
const {
	assignNonEnumerable,
	eventDispatcher,
	shouldRecordObservationOnAllKeysExceptFunctionsOnProto
} = require("./helpers");

const hasOwn = Object.prototype.hasOwnProperty;
const { isSymbolLike } = canReflect;
const metaSymbol = Symbol.for("can.meta");

const proxiedObjects = new WeakMap();
const proxies = new WeakSet();

const proxyKeys = Object.create(null);
Object.getOwnPropertySymbols(mapBindings).forEach(function(symbol){
	assignNonEnumerable(proxyKeys, symbol, mapBindings[symbol]);
});
computedHelpers.addKeyDependencies(proxyKeys);

const mutateMethods = {
	"push": function(arr, args) {
		return [{
			index: arr.length - args.length,
			deleteCount: 0,
			insert: args,
			type: "splice"
		}];
	},
	"pop": function(arr) {
		return [{
			index: arr.length,
			deleteCount: 1,
			insert: [],
			type: "splice"
		}];
	},
	"shift": function() {
		return [{
			index: 0,
			deleteCount: 1,
			insert: [],
			type: "splice"
		}];
	},
	"unshift": function(arr, args) {
		return [{
			index: 0,
			deleteCount: 0,
			insert: args,
			type: "splice"
		}];
	},
	"splice": function(arr, args) {
		return [{
			index: args[0],
			deleteCount: args[1],
			insert: args.slice(2),
			type: "splice"
		}];
	},
	"sort": function(arr) {
		// The array replaced everything.
		return [{
			index: 0,
			deleteCount: arr.length,
			insert: arr,
			type: "splice"
		}];
	},
	"reverse": function(arr, args, old) {
		// The array replaced everything.
		return [{
			index: 0,
			deleteCount: arr.length,
			insert: arr,
			type: "splice"
		}];
	}
};

// Overwrite Array's methods that mutate to:
// - prevent other events from being fired off (index events and length events.)
// - dispatch patches events.
canReflect.eachKey(mutateMethods, function(makePatches, prop){
	var protoFn = Array.prototype[prop];
	var mutateMethod = function() {
		var meta = this[symbols.metaSymbol],
			// Capture if this function should be making sideEffects
			makeSideEffects = meta.preventSideEffects === 0,
			oldLength = meta.target.length;

		// Prevent proxy from calling ObservationRecorder and sending events.
		meta.preventSideEffects++;

		// Call the function -- note that *this* is the Proxy here, so
		// accesses in the function still go through `get()` and `set()`.
		var ret = protoFn.apply(meta.target, arguments);
		var patches = makePatches(meta.target, Array.from(arguments), oldLength);

		if (makeSideEffects === true) {
			//!steal-remove-start
			var reasonLog = [canReflect.getName(meta.proxy)+"."+prop+" called with", arguments];
			//!steal-remove-end
			var dispatchArgs = {
				type: "length",
				patches: patches
			};

			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				dispatchArgs.reasonLog = reasonLog;
			}
			//!steal-remove-end

			mapBindings.dispatch.call( meta.proxy, dispatchArgs , [meta.target.length, oldLength]);
		}

		meta.preventSideEffects--;
		return ret;
	};
	//!steal-remove-start
	if(process.env.NODE_ENV !== 'production') {
		Object.defineProperty(mutateMethod, "name", {
			value: prop
		});
	}
	//!steal-remove-end

	// Store the proxied method so it will be used instead of the
	// prototype method.
	proxiedObjects.set(protoFn, mutateMethod);
	proxies.add(mutateMethod);
});

function setValueAndOnChange(key, value, target, proxy, onChange) {
	let old, change;
	let hadOwn = hasOwn.call(target, key);

	let descriptor = Object.getOwnPropertyDescriptor(target, key);
	// call the setter on the Proxy to properly do any side-effect sets (and run corresponding handlers)
	// -- setters do not return values, so it is unnecessary to check for changes.
	if (descriptor && descriptor.set) {
		descriptor.set.call(proxy, value);
	} else {
		// otherwise check for a changed value
		old = target[key];
		change = old !== value;
		if (change) {
			target[key] = value;
			onChange(hadOwn, old);
		}
	}
}

function didLengthChangeCauseDeletions(key, value, old) {
	return key === "length" && value < old;
}

const proxyHandlers = {
	get(target, key, receiver) {
		if (isSymbolLike(key)) {
			return target[key];
		}

		let proxy = proxiedObjects.get(target);
		ObservationRecorder.add(proxy, key.toString());

		let value = Reflect.get(target, key, receiver);
		return value;
	},

	set(target, key, newValue, receiver) {
		let proxy = proxiedObjects.get(target);
		let startingLength = target.length;

		setValueAndOnChange(key, newValue, target, proxy, function(hadOwn, oldValue) {
			// Determine the patches this change should dispatch
			let patches = [{
				key: key,
				type: hadOwn ? "set" : "add",
				value: newValue
			}];

			let numberKey = !isSymbolLike(key) && +key;

			// If we are adding an indexed value like `arr[5] =value` ...
			if (Number.isInteger(numberKey)) {
				// If we set an enumerable property after the length ...
				if (!hadOwn && numberKey > startingLength) {
					// ... add patches for those values.
					patches.push({
						index: startingLength,
						deleteCount: 0,
						insert: target.slice(startingLength),
						type: "splice"
					});
				} else {
					// Otherwise, splice the value into the array.
					patches.push.apply(patches, mutateMethods.splice(target,
						[numberKey, 1, newValue]));
				}
			}

			// In the case of deleting items by setting the length of the array,
			// add patches that splice the items removed.
			// (deleting individual items from an array doesn't change the length; it just creates holes)
			if (didLengthChangeCauseDeletions(key, newValue, oldValue)) {
				patches.push({
					index: newValue,
					deleteCount: oldValue - newValue,
					insert: [],
					type: "splice"
				});
			}
			//!steal-remove-start
			let reasonLog = [canReflect.getName(proxy)+ " set", key, "to", newValue];
			//!steal-remove-end

			let dispatchArgs = {
				type: key,
				patches: patches,
				keyChanged: !hadOwn ? key : undefined
			};

			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				dispatchArgs.reasonLog = reasonLog;
			}
			//!steal-remove-end

			//mapBindings.dispatch.call( meta.proxy, dispatchArgs, [value, old]);
			eventDispatcher(receiver, key, oldValue, newValue);
		});

		return true;
	},
	deleteProperty(target, key) {
		let old = this.target[key];
		let deleteSuccessful = delete this.target[key];

		// Fire event handlers if we were able to delete and the value changed.
		if (deleteSuccessful && this.preventSideEffects === 0 && old !== undefined) {
			//!steal-remove-start
			let reasonLog = [canReflect.getName(this.proxy) + " deleted", key];
			//!steal-remove-end
			// wrapping in process.env.NODE_ENV !== 'production' causes out of scope error
			let dispatchArgs = {
				type: key,
				patches: [{
					key: key,
					type: "delete"
				}],
				keyChanged: key
			};
			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				dispatchArgs.reasonLog = reasonLog;
			}
			//!steal-remove-end

			eventDispatcher(this.proxy, dispatchArgs, [undefined, old]);
		}

		return deleteSuccessful;
	},
	ownKeys(target) {
		ObservationRecorder.add(this.proxy, "can.keys");

		return Object.getOwnPropertyNames(this.target)
			.concat(Object.getOwnPropertySymbols(this.target))
			.concat(Object.getOwnPropertySymbols(this.proxyKeys));
	}
};

function makeObservable(array, options) {
	let meta = {
		target: array,
		proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(proxyKeys),
		computedKeys: Object.create(null),
		options: options,
		// `preventSideEffects` is a counter used to "turn off" the proxy.  This is incremented when some
		// function (like `Array.splice`) wants to handle event dispatching and/or calling
		// `ObservationRecorder` itself for performance reasons.
		preventSideEffects: 0
	};
	meta.proxyKeys[metaSymbol] = meta;

	meta.proxy = new Proxy(array, {
		get: proxyHandlers.get.bind(meta),
		set: proxyHandlers.set.bind(meta),
		ownKeys: proxyHandlers.ownKeys.bind(meta),
		deleteProperty: proxyHandlers.deleteProperty.bind(meta),
		meta: meta
	});
	mapBindings.addHandlers(meta.proxy, meta);
	return meta.proxy;
}

function proxyArray() {
	return class ProxyArray extends Array {
		constructor(...items) {
			super(...items);

			let localProxyKeys = Object.create(proxyKeys);
        	localProxyKeys.constructor = this.constructor;

			let observable = makeObservable(this, {
				//observe: makeObserve.observe,
 				proxyKeys: localProxyKeys,
 				shouldRecordObservation: shouldRecordObservationOnAllKeysExceptFunctionsOnProto
			});
			proxiedObjects.set(this, observable);
			proxies.add(observable);
			return observable;
		}
	};
}

module.exports = proxyArray;
