const canReflect = require("can-reflect");
const {
	makeDefineInstanceKey,
	mixins,
	mixinMapProps,
	mixinTypeEvents
} = require("can-observable-mixin");
const {
	dispatchLengthPatch
} = require("./helpers");
const ProxyArray = require("./proxy-array")();
const queues = require("can-queues");
const type = require("can-type");

// symbols aren't enumerable ... we'd need a version of Object that treats them that way
const localOnPatchesSymbol = "can.patches";
const onKeyValueSymbol = Symbol.for("can.onKeyValue");
const offKeyValueSymbol = Symbol.for("can.offKeyValue");
const metaSymbol = Symbol.for("can.meta");

function convertItem (Constructor, item) {
	if(Constructor.items) {
		const definition = mixins.normalizeTypeDefinition(Constructor.items.type || Constructor.items);
		return canReflect.convert(item, definition);
	}
	return item;
}

function convertItems(Constructor, items) {
	if(items.length) {
		if(Constructor.items) {
			for(let i = 0, len = items.length; i < len; i++) {
				items[i] = convertItem(Constructor, items[i]);
			}
		}
	}
}

const MixedInArray = mixinTypeEvents(mixinMapProps(ProxyArray));

class ObservableArray extends MixedInArray {
	// TODO define stuff here
	constructor(items, props) {
		// Arrays can be passed a length like `new Array(15)`
		let isLengthArg = typeof items === "number";
		if(isLengthArg) {
			super(items);
		} else if(arguments.length > 0 && !Array.isArray(items)) {
			throw new Error("can-observable-array: Unexpected argument: " + typeof items);
		} else {
			super();
		}

		mixins.finalizeClass(new.target);
		mixins.initialize(this, props || {});

		for(let i = 0, len = items && items.length; i < len; i++) {
			this[i] = convertItem(new.target, items[i]);
		}
	}

	static get [Symbol.species]() {
		return this;
	}

	static [Symbol.for("can.new")](items) {
		let array = items || [];
		return new this(array);
	}

	push(...items) {
		convertItems(this.constructor, items);
		return super.push(...items);
	}

	unshift(...items) {
		convertItems(this.constructor, items);
		return super.unshift(...items);
	}

	filter(callback) {
		if(typeof callback === "object") {
			let props = callback;
			callback = function(item) {
				for (let prop in props) {
					if (item[prop] !== props[prop]) {
						return false;
					}
				}
				return true;
			};
		}

		return super.filter(callback);
	}

	forEach(...args) {
		return Array.prototype.forEach.apply(this, args);
	}

	splice(...args) {
		let index = args[0],
			howMany = args[1],
			added = [],
			i, len, listIndex,
			allSame = args.length > 2;

		index = index || 0;

		// converting the arguments to the right type
		for (i = 0, len = args.length - 2; i < len; i++) {
			listIndex = i + 2;
			// This should probably be a DefineObject but how?
			args[listIndex] = convertItem(this.constructor, args[listIndex]);
			//args[listIndex] = this.__type(args[listIndex], listIndex);
			added.push(args[listIndex]);

			// Now lets check if anything will change
			if (this[i + index] !== args[listIndex]) {
				allSame = false;
			}
		}

		// if nothing has changed, then return
		if (allSame && this.length <= added.length) {
			return added;
		}

		// default howMany if not provided
		if (howMany === undefined) {
			howMany = args[1] = this.length - index;
		}

		queues.batch.start();
		var removed = super.splice.apply(this, args);
		queues.batch.stop();
		return removed;
	}

	static convertsTo(Type) {
		const ConvertedType = type.convert(Type);

		const ArrayType = class extends this {
			static get items() {
				return ConvertedType;
			}
		};

		const name = `ConvertedObservableArray<${canReflect.getName(Type)}>`;
		canReflect.setName(ArrayType, name);

		return ArrayType;
	}

	/* Symbols */
	[Symbol.for("can.splice")](index, deleteCount, insert){
		return this.splice(...[index, deleteCount].concat(insert));
	}

	[Symbol.for("can.onPatches")](handler, queue){
		this[onKeyValueSymbol](localOnPatchesSymbol, handler,queue);
	}

	[Symbol.for("can.offPatches")](handler, queue) {
		this[offKeyValueSymbol](localOnPatchesSymbol, handler, queue);
	}

	get [Symbol.for("can.isListLike")]() {
		return true;
	}
}

var mutateMethods = {
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
			type: "splice"
		}];
	},
	"shift": function() {
		return [{
			index: 0,
			deleteCount: 1,
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
		return [{
			index: 0,
			deleteCount: arr.length,
			insert: arr,
			type: "splice"
		}];
	},
	"reverse": function(arr) {
		return [{
			index: 0,
			deleteCount: arr.length,
			insert: arr,
			type: "splice"
		}];
	}
};

canReflect.eachKey(mutateMethods, function(makePatches, prop) {
	const protoFn = ObservableArray.prototype[prop];
	ObservableArray.prototype[prop] = function() {
		const oldLength = this.length;

		// prevent `length` event from being dispatched by get/set proxy hooks
		this[metaSymbol].preventSideEffects++;
		const result = protoFn.apply(this, arguments);
		this[metaSymbol].preventSideEffects--;

		const patches = makePatches(this, Array.from(arguments));
		dispatchLengthPatch.call(this, prop, patches, this.length, oldLength);
		return result;
	};
});

makeDefineInstanceKey(ObservableArray);

module.exports = ObservableArray;
