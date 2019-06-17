const canReflect = require("can-reflect");
const mapBindings = require("can-event-queue/map/map");
const ObservationRecorder = require("can-observation-recorder");
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

				mapBindings.dispatch.call(map, dispatched, [newVal, current]);
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
	triggerChange: function(attr, how, newVal, oldVal) {
		var index = +attr;
		// `batchTrigger` direct add and remove events...

		// Make sure this is not nested and not an expando
		if (!isNaN(index)) {
			var itemsDefinition = this._define.definitions["#"];
			var patches, dispatched;
			if (how === 'add' || how === 'set') {
				if (itemsDefinition && typeof itemsDefinition.added === 'function') {
					ObservationRecorder.ignore(itemsDefinition.added).call(this, newVal, index);
				}

				patches = [{type: how, insert: newVal, index: index, deleteCount: 0}];
				dispatched = {
					type: 'splice',
					patches: patches
				};

				//!steal-remove-start
				if(process.env.NODE_ENV !== 'production') {
					dispatched.reasonLog = [ canReflect.getName(this), "added", newVal, "at", index ];
				}
				//!steal-remove-end
				this.dispatch(dispatched, [ newVal, index ]);
				this.dispatch({ type: index }, [ newVal, oldVal ]);

				if (how === "add") {
					this.dispatch("length", [this.length, this.length - 1]);
				}

			} else if (how === 'remove') {
				if (itemsDefinition && typeof itemsDefinition.removed === 'function') {
					ObservationRecorder.ignore(itemsDefinition.removed).call(this, oldVal, index);
				}

				patches = [{type: how, index: index, deleteCount: oldVal.length}];
				dispatched = {
					type: 'splice',
					patches: patches
				};
				//!steal-remove-start
				if(process.env.NODE_ENV !== 'production') {
					dispatched.reasonLog = [ canReflect.getName(this), "remove", oldVal, "at", index ];
				}
				//!steal-remove-end
				this.dispatch(dispatched, [ oldVal, index ]);

				this.dispatch("length", [this.length, this.length + 1]);

			} else {
				this.dispatch(how, [ newVal, index ]);
			}
		} else {
			this.dispatch({
				type: "" + attr,
				target: this
			}, [ newVal, oldVal ]);
		}
	}
};

module.exports = helpers;
