const canReflect = require("can-reflect");
const {
	makeDefineInstanceKey,
	mixins,

	mixinMapProps,
	mixinProxy,
	mixinTypeEvents
} = require("can-define-mixin");
const ProxyArray = require("./proxy-array")();

const itemType = Symbol.for("can.defineArrayType");
const finalized = Symbol.for("can.defineArrayFinalized");

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
		convertItems(new.target, items);
		super(...items);
		mixins.finalizeClass(this.constructor);
		mixins.initialize(this, {});
	}

	static get [Symbol.species]() {
		return this;
	}

	static [Symbol.for("can.new")](items) {
		return new this(...items);
	}

	splice(index, howMany, ...items) {
		convertItems(this.constructor, items);
		super.splice(index, howMany, ...items);
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
}

makeDefineInstanceKey(DefineArray);

module.exports = DefineArray;
