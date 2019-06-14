const DefineArray = require("../src/can-define-array");
const DefineObject = require("can-define-object");
const QUnit = require("steal-qunit");

module.exports = function() {
	QUnit.module("ExtendedDefineArray.items");

	QUnit.test("calling new with items", function(assert) {
		class Todo extends DefineObject {}
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
		class Todo extends DefineObject {}
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
		class Todo extends DefineObject {}
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
		class Todo extends DefineObject {}
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

	QUnit.test("The new Array(length) form works", function(assert) {
		class Pet extends DefineObject {
			static get define() {
				return {
					name: {
						type: String,
						required: true
					}
				};
			}
		}
		class Pets extends DefineArray {
			static get items() { return Pet; }
		}
		try {
			let array = new Pets(5);
			assert.equal(array.length, 5, "have an array of 5 nothings");
		} catch(e) {
			assert.notOk(e, "threw :(");
		}

	});
};
