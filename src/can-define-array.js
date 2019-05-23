const canReflect = require("can-reflect");
const ObservationRecorder = require("can-observation-recorder");

const hasOwn = Object.prototype.hasOwnProperty;
const { isSymbolLike } = canReflect;

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

function proxyArray(Array) {
	const proxies = new WeakMap();
	const proxyHandlers = {
		get(target, key, receiver) {
			if (isSymbolLike(key)) {
				return target[key];
			}

			let proxy = proxies.get(target);
			ObservationRecorder.add(proxy, key.toString());

			let value = Reflect.get(target, key, receiver);
			return value;
		},

		set(target, key, newValue, receiver) {
			let proxy = proxies.get(target);
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
		}
	};



	return class ProxyArray extends Array {
		constructor(items) {
			super(items);
			let proxy = new Proxy(this, proxyHandlers);
			proxies.set(this, proxy);
			return proxy;
		}
	};
}

module.exports = proxyArray;
