const ObservableArray = require("../src/can-observable-array");
const ObservableObject = require("can-observable-object");
const canReflect = require("can-reflect");
const QUnit = require("steal-qunit");
const type = require("can-type");

module.exports = function() {
	QUnit.module("ExendedObservableArray.staticOf");

	QUnit.test("ObservableArray from static of", function(assert) {
		const arr = ObservableArray.of(ObservableObject);

		assert.ok(arr.prototype instanceof ObservableArray);
	});
	
	QUnit.test("Can use type.convert", function(assert) {
		const ObservableOfArray = ObservableArray.of(type.convert(ObservableObject));
		const ObservableOf = new ObservableOfArray()
		ObservableOf.push({ name: 'Matt' });

		assert.deepEqual(ObservableOf.length, 1, 'we have correct length');
		assert.deepEqual(canReflect.getName(ObservableOf), 'ObservableArrayOf<Child>[]', 'we have correct name');
	});
};
