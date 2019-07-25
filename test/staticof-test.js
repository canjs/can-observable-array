const ObservableArray = require("../src/can-observable-array");
const ObservableObject = require("can-observable-object");
const QUnit = require("steal-qunit");
const type = require("can-type");

module.exports = function() {
	QUnit.module("ExendedObservableArray.staticOf");

	QUnit.test("ObservableArray from static of", function(assert) {
		const arr = ObservableArray.of(ObservableObject);
		assert.ok(arr instanceof ObservableArray);
	});
	
	QUnit.test("Can use type.convert", function(assert) {
		const arr = ObservableArray.of(type.convert(ObservableObject));
		arr.push({ name: 'Matt' });
		assert.deepEqual(arr.length, 1, 'we have correct length');
	});
};
