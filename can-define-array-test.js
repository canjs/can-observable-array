const canReflect = require("can-reflect");
const DefineArray = require("./src/can-define-array");
const DefineObject = require("can-define-object");
const QUnit = require("steal-qunit");

QUnit.module("can-define-array", function(hooks) {
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

	QUnit.module("ExtendedDefineArray.items");

	QUnit.test("calling new with items", function(assert) {
		class Todo extends DefineObject {};
		class TodoList extends DefineArray {
			static get items() {
				return Todo;
			}
		}

		let todos = new TodoList([{ label: "Walk the dog" }]);
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".splice", function(assert) {
		class Todo extends DefineObject {};
		class TodoList extends DefineArray {
			static get items() {
				return Todo;
			}
		}

		let todos = new TodoList();
		todos.splice(0, 0, { label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".push", function(assert) {
		class Todo extends DefineObject {};
		class TodoList extends DefineArray {
			static get items() {
				return Todo;
			}
		}

		let todos = new TodoList();
		todos.push({ label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".unshift", function(assert) {
		class Todo extends DefineObject {};
		class TodoList extends DefineArray {
			static get items() {
				return Todo;
			}
		}

		let todos = new TodoList();
		todos.unshift({ label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});
});
