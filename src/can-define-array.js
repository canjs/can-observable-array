const {
	makeDefineInstanceKey,
	mixins,

	mixinMapProps,
	mixinProxy,
	mixinTypeEvents
} = require("can-define-mixin");
const ProxyArray = require("./proxy-array")();

class DefineArray extends ProxyArray {
	// TODO define stuff here
	constructor(...items) {
		super(...items);
		mixins.finalizeClass(this.constructor);
		mixins.initialize(this, items);
	}
}

DefineArray = mixinTypeEvents(mixinMapProps(DefineArray));
makeDefineInstanceKey(DefineArray);

module.exports = DefineArray;
