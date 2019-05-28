const canReflect = require("can-reflect");
const DefineArray = require("./src/can-define-array");
const QUnit = require("steal-qunit");

QUnit.test("mixinProxyArray adds proxyability to arrays", function(assert) {
	class Todos extends DefineArray {}

	let todos = new Todos();
	let calls = 0;
	let expected = 2;

	canReflect.onKeyValue(todos, 0, newValue => {
		calls++;
		assert.equal(newValue, "get this working", "able to listen to push");
	});

	canReflect.onKeyValue(todos, 14, newValue => {
		calls++;
		assert.equal(newValue, "some value", "able to listen to property setter");
	});

	todos.push("get this working");
	todos[14] = "some value";

	assert.equal(calls, expected, "Got all of the values I expected");
});
