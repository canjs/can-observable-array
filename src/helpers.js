const canReflect = require("can-reflect");
const inSetupSymbol = Symbol.for("can.initializing");

const helpers = {
	assignNonEnumerable: function(obj, key, value) {
		return Object.defineProperty(obj, key, {
		    enumerable: false,
		    writable: true,
		    configurable: true,
		    value: value
		});
	},
	eventDispatcher: function(map, prop, current, newVal) {
		if (map[inSetupSymbol]) {
			return;
		}
		else {
			if (newVal !== current) {
				var dispatched = {
					patches: [{type: "set", key: prop, value: newVal}],
					type: prop,
					target: map
				};

				//!steal-remove-start
				if(process.env.NODE_ENV !== 'production') {
					dispatched.reasonLog = [ canReflect.getName(this) + "'s", prop, "changed to", newVal, "from", current ];
				}
				//!steal-remove-end

				map.dispatch(dispatched, [newVal, current]);
			}
		}
	},
	shouldRecordObservationOnAllKeysExceptFunctionsOnProto: function(keyInfo, meta){
		return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (
			// it's on us
			(// it's on our proto, but not a function
			(keyInfo.targetHasOwnKey ) ||
			// it's "missing", and we are not sealed
			(!keyInfo.protoHasKey && !Object.isSealed(meta.target)) || keyInfo.protoHasKey && (typeof targetValue !== "function"))
		);
	},
};

module.exports = helpers;
