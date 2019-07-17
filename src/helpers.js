const canReflect = require("can-reflect");
const ObservationRecorder = require("can-observation-recorder");
const mapBindings = require("can-event-queue/map/map");
const metaSymbol = Symbol.for("can.meta");

const helpers = {
	assignNonEnumerable: function(obj, key, value) {
		return Object.defineProperty(obj, key, {
		    enumerable: false,
		    writable: true,
		    configurable: true,
		    value: value
		});
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
	/*
	 * dispatch an event when an index changes
	 */
	dispatchIndexEvent: function(attr, how, newVal, oldVal) {
		var index = +attr;
		// Make sure this is not nested and not an expando
		if (!isNaN(index)) {
			var itemsDefinition = this._define.definitions["#"];
			if (how === 'set') {
				this.dispatch({ type: index }, [ newVal, oldVal ]);

				// if event is being set through an ObservableArray.prototype method,
				// do not dispatch length or patch events.
				// This will be handled by ObservableArray.prototype method.
				let meta = this[metaSymbol];
				if (!("preventSideEffects" in meta) || meta.preventSideEffects === 0) {
					let patches = [{
						index: index,
						deleteCount: 1,
						insert: [ newVal ],	
						type: "splice"
					}];
					helpers.dispatchLengthPatch.call(this, how, patches, this.length, this.length);
				}
			} else if (how === 'add') {
				if (itemsDefinition && typeof itemsDefinition.added === 'function') {
					ObservationRecorder.ignore(itemsDefinition.added).call(this, newVal, index);
				}

				this.dispatch({ type: index }, [ newVal, oldVal ]);

				// if event is being set through an ObservableArray.prototype method,
				// do not dispatch length or patch events.
				// This will be handled by ObservableArray.prototype method.
				let meta = this[metaSymbol];
				if (!("preventSideEffects" in meta) || meta.preventSideEffects === 0) {
					let patches = [{
						index: index,
						deleteCount: 0,
						insert: [ newVal ],	
						type: "splice"
					}];
					helpers.dispatchLengthPatch.call(this, how, patches, this.length, this.length - 1);
				}
			} else if (how === 'remove') {
				if (itemsDefinition && typeof itemsDefinition.removed === 'function') {
					ObservationRecorder.ignore(itemsDefinition.removed).call(this, oldVal, index);
				}
			}
		} else {
			this.dispatch({
				type: "" + attr,
				target: this
			}, [ newVal, oldVal ]);
		}
	},
	/*
	 * Dispatch a `type: "splice"` patch and a `length` event
	 */
	dispatchLengthPatch: function(how, patches, newLength, oldLength) {
		const dispatchArgs = {
			type: "length",
			patches: patches
		};

		//!steal-remove-start
		if(process.env.NODE_ENV !== "production") {
			dispatchArgs.reasonLog = [canReflect.getName(this) + "." + how + " called with", arguments];
		}
		//!steal-remove-end

		mapBindings.dispatch.call(this, dispatchArgs, [newLength, oldLength]);
	}
};

module.exports = helpers;
