const canReflect = require("can-reflect");
const {
	makeDefineInstanceKey,
	mixins,

	mixinMapProps,
	mixinTypeEvents
} = require("can-define-mixin");
const ProxyArray = require("./proxy-array")();
const queues = require("can-queues");

// symbols aren't enumerable ... we'd need a version of Object that treats them that way
const localOnPatchesSymbol = "can.patches";
const onKeyValueSymbol = Symbol.for("can.onKeyValue");
const offKeyValueSymbol = Symbol.for("can.offKeyValue");

function convertItems(Constructor, items) {
	if(items.length) {
		if(Constructor.items) {
			for(let i = 0, len = items.length; i < len; i++) {
				items[i] = canReflect.convert(items[i], Constructor.items);
			}
		}
	}
}

const MixedInArray = mixinTypeEvents(mixinMapProps(ProxyArray));

class DefineArray extends MixedInArray {
	// TODO define stuff here
	constructor(...items) {
		// Arrays can be passed a length like `new Array(15)`
		let isLengthArg = items.length === 1 && typeof items[0] === "number";
		if(!isLengthArg) {
			convertItems(new.target, items);
		}

		super(...items);
		mixins.finalizeClass(this.constructor);
		mixins.initialize(this, {});
	}

	static get [Symbol.species]() {
		return this;
	}

	static [Symbol.for("can.new")](items) {
		let array = items || [];
		return new this(...array);
	}

	push(...items) {
		convertItems(this.constructor, items);
		super.push(...items);
	}

	unshift(...items) {
		convertItems(this.constructor, items);
		super.unshift(...items);
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
			args[listIndex] = canReflect.convert(args[listIndex], this.constructor.items || Object);
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

makeDefineInstanceKey(DefineArray);

module.exports = DefineArray;
