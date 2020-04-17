const QUnit = require("steal-qunit");

let supportsClassFields;
try {
	eval(`class Foo {
		field = "value"
	}`);
	supportsClassFields = true;
} catch(e) {
	supportsClassFields = false;
}

QUnit.module("can-observable-array", function() {
	require("./test/array-test")();
	require("./test/items-test")();
	require("./test/propdefaults-test")();
	require("./test/steal-import-test");
	if (supportsClassFields) {
		//It doesn't work with require
		//Even when change the above imports to require
		steal.import('~/test/class-field-test');
	}
});
