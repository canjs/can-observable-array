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

class DefineArray extends ProxyArray {
	// TODO define stuff here
	constructor(...items) {
		convertItems(new.target, items);
		super(...items);
		mixins.finalizeClass(this.constructor);
		mixins.initialize(this, {});
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
}

DefineArray = mixinTypeEvents(mixinMapProps(DefineArray));
makeDefineInstanceKey(DefineArray);

module.exports = DefineArray;
