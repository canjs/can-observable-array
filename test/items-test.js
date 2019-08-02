const ObservableArray = require("../src/can-observable-array");
const ObservableObject = require("can-observable-object");
const type = require("can-type");
const QUnit = require("steal-qunit");

module.exports = function() {
	QUnit.module("ExtendedObservableArray.items");

	QUnit.test("calling new with items", function(assert) {
		class Todo extends ObservableObject {}
		class TodoList extends ObservableArray {
			static get items() {
				return type.convert(Todo);
			}
		}

		let todos = new TodoList([{ label: "Walk the dog" }]);
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".splice", function(assert) {
		class Todo extends ObservableObject {}
		class TodoList extends ObservableArray {
			static get items() {
				return type.convert(Todo);
			}
		}

		let todos = new TodoList();
		todos.splice(0, 0, { label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".push", function(assert) {
		class Todo extends ObservableObject {}
		class TodoList extends ObservableArray {
			static get items() {
				return type.convert(Todo);
			}
		}

		let todos = new TodoList();
		todos.push({ label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test(".unshift", function(assert) {
		class Todo extends ObservableObject {}
		class TodoList extends ObservableArray {
			static get items() {
				return type.convert(Todo);
			}
		}

		let todos = new TodoList();
		todos.unshift({ label: "Walk the dog" });
		let firstTodo = todos[0];

		assert.ok(firstTodo instanceof Todo, "Item worked");
	});

	QUnit.test("The new Array(length) form works", function(assert) {
		class Pet extends ObservableObject {
			static get props() {
				return {
					name: {
						type: String,
						required: true
					}
				};
			}
		}
		class Pets extends ObservableArray {
			static get items() { return Pet; }
		}
		try {
			let array = new Pets(5);
			assert.equal(array.length, 5, "have an array of 5 nothings");
		} catch(e) {
			assert.notOk(e, "threw :(");
		}

	});

	QUnit.test("#29 items property definition as object", function(assert) {
		class Person extends ObservableObject {
			static get props() {
				return {
					name: {
						type: String,
						required: true
					}
				};
			}
		}
		class Persons extends ObservableArray {
			static get items() {
				return {
					type: type.convert(Person)
				};
			}
		}
		try {
			let array = new Persons([{ name: 'Matt' }, { name: 'Kevin' }]);
			array.splice(1, 1, { name: 'Justin' });
			assert.deepEqual(array[0].name, 'Matt', "should have Matt");
			assert.ok(array[1] instanceof Person, "should be an instance of Person");
			assert.deepEqual(array[1].name, 'Justin', "should have Justin");
		} catch(e) {
			assert.notOk(e, "threw :(");
		}
	});
};
