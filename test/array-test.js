const canReflect = require("can-reflect");
const DefineArray = require("../src/can-define-array");
const QUnit = require("steal-qunit");

module.exports = function() {
	QUnit.test("Adds proxyability to arrays", function(assert) {
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

	QUnit.test(".filter can be provided an object", function(assert) {
		class Todos extends DefineArray {}

		let todos = new Todos(...[
			{ name: "walk the dog" },
			{ name: "cook dinner", completed: true }
		]);

		let completed = todos.filter({ completed: true });
		assert.equal(completed.length, 1, "only one");
		assert.equal(completed[0].name, "cook dinner");
		assert.ok(completed instanceof Todos, "Filtered item is of right type");
	});

	QUnit.test("canReflect.new creates a new array with items", function(assert) {
		class Todos extends DefineArray {}

		let todos = canReflect.new(Todos, [
			{ name: "walk the dog" },
			{ name: "cook dinner", completed: true }
		]);

		assert.equal(todos.length, 2, "There are 2 items");
		assert.equal(todos[0].name, "walk the dog");
	});

	QUnit.test("forEach works", function(assert) {
		class Todos extends DefineArray {}

		let todos = new Todos(...[
			{ name: "walk the dog" },
			{ name: "cook dinner", completed: true }
		]);

		let expected = 2;
		let actual = 0;

		todos.forEach(() => {
			actual++;
		});

		assert.equal(actual, expected, "Looped over each item");
	});

	QUnit.test("splice dispatches patches and length events", function(assert) {
		class Todos extends DefineArray {}

		let todos = new Todos(
			{ name: "walk the dog" },
			{ name: "cook dinner", completed: true }
		);

		let expected = 2, actual = 0;

		canReflect.onPatches(todos, patches => {
			if(patches[0].type === "splice") {
				assert.ok(true, "splice patches called");
				actual++;
			}
		});

		canReflect.onKeyValue(todos, "length", () => {
			actual++;
		});

		todos.splice(0, 1);

		assert.equal(actual, expected, "Length and patches called");
	});
};
