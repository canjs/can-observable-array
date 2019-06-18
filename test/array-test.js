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
				assert.ok(true, "splice patch called");
				actual++;
			}
		});

		canReflect.onKeyValue(todos, "length", () => {
			actual++;
		});

		todos.splice(0, 1);

		assert.equal(actual, expected, "Length and patches called");
	});

	QUnit.test("can.splice dispatches patches and length events", function(assert) {
		class Todos extends DefineArray {}

		let todos = new Todos(
			{ name: "walk the dog" },
			{ name: "cook dinner", completed: true }
		);

		let expected = 2, actual = 0;

		canReflect.onPatches(todos, patches => {
			if(patches[0].type === "splice") {
				assert.ok(true, "set patch called");
				actual++;
			}
		});

		canReflect.onKeyValue(todos, "length", () => {
			actual++;
		});

		canReflect.splice(todos, 0, 1);

		assert.equal(actual, expected, "Length and patches called");
	});

	QUnit.test("isListLike", function(assert) {
		let array = new DefineArray("one", "two");
		assert.equal(canReflect.isListLike(array), true, "it is list like");

		class Extended extends DefineArray {
		}

		let extended = new Extended("one", "two");
		assert.equal(canReflect.isListLike(extended), true, "It is list like");
	});

	QUnit.test("push dispatches patches and length events", function(assert) {
		class Hobbies extends DefineArray {}
		const hobbies = new Hobbies();

		let expected = 2, actual = 0;

		canReflect.onPatches(hobbies, patches => {
			if(patches[0].type === "splice") {
				assert.ok(true, "splice patches called");
				actual++;
			}
		});

		canReflect.onKeyValue(hobbies, "length", () => {
			actual++;
		});

		hobbies.push("cooking");

		assert.equal(actual, expected, "Length and patches called");
	});

	QUnit.test("can take undefined as a value with can.new", function(assert) {
		let array = canReflect.new(DefineArray, undefined);
		assert.deepEqual(array, [], "no values, just like with DefineList");
	});

	QUnit.test("setting values dispatch the correct events", function(assert) {
		var testSteps = [
			{
				prop: 0,
				value: "hi",
				events: [
					{ type: 0, newVal: "hi", oldVal: undefined },
					{ type: "length", newVal: 1, oldVal: 0 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["hi"] }]
				]
			},
			{
				prop: 0,
				value: "hello",
				events: [
					{ type: 0, newVal: "hello", oldVal: "hi" },
					{ type: "length", newVal: 1, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 1, insert: ["hello"] }]
				]

			},
			{
				prop: 1,
				value: "there",
				events: [
					{ type: 1, newVal: "there", oldVal: undefined },
					{ type: "length", newVal: 2, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 1, deleteCount: 0, insert: ["there"] }]
				]

			},
		];

		const arr = new DefineArray();

		let actualEvents, actualPatches;
		canReflect.onKeyValue(arr, 0, (newVal, oldVal) => {
			actualEvents.push({ type: 0, newVal, oldVal });
		});

		canReflect.onKeyValue(arr, 1, (newVal, oldVal) => {
			actualEvents.push({ type: 1, newVal, oldVal });
		});

		canReflect.onKeyValue(arr, "length", (newVal, oldVal) => {
			actualEvents.push({ type: "length", newVal, oldVal });
		});

		canReflect.onPatches(arr, (patches) => {
			actualPatches.push(patches);
		});

		testSteps.forEach((step) => {
			// reset everything
			actualEvents = [];
			actualPatches = [];

			// get the data for the step
			const { prop, value, events, patches } = step;

			// set the value from the step
			arr[prop] = value;

			// check that the correct events and patches were dispatched
			assert.deepEqual(actualEvents, events, `arr[${prop}] = "${value}" dispatched correct events`);
			assert.deepEqual(actualPatches, patches, `arr[${prop}] = "${value}" dispatched correct patches`);
		});
	});

	QUnit.test("array methods dispatch the correct events", function(assert) {
		var testSteps = [
			{
				method: "push",
				args: [ "hi" ],
				events: [
					{ type: 0, newVal: "hi", oldVal: undefined },
					{ type: "length", newVal: 1, oldVal: 0 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["hi"] }]
				]
			},
			{
				method: "push",
				args: [ "hi", "there" ],
				events: [
					{ type: 0, newVal: "hi", oldVal: undefined },
					{ type: 1, newVal: "there", oldVal: undefined },
					{ type: "length", newVal: 2, oldVal: 0 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["hi", "there"] }]
				]
			},
			{
				initialData: [ "there" ],
				method: "unshift",
				args: [ "hello" ],
				events: [
					{ type: 1, newVal: "there", oldVal: undefined },
					{ type: 0, newVal: "hello", oldVal: "there" },
					{ type: "length", newVal: 2, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["hello"] }],
				]
			},
			{
				initialData: [ "you" ],
				method: "unshift",
				args: [ "how", "are" ],
				events: [
					{ type: 2, newVal: "you", oldVal: undefined },
					{ type: 0, newVal: "how", oldVal: "you" },
					{ type: 1, newVal: "are", oldVal: undefined },
					{ type: "length", newVal: 3, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["how", "are"] }],
				]
			},
			{
				initialData: [ "hi", "there" ],
				method: "pop",
				args: [],
				events: [
					{ type: "length", newVal: 1, oldVal: 2 }
				],
				patches: [
					[{ type: "splice", index: 1, deleteCount: 1 }]
				]
			},
			{
				initialData: [ "hi", "there" ],
				method: "shift",
				args: [],
				events: [
					{ type: 0, newVal: "there", oldVal: "hi" },
					{ type: "length", newVal: 1, oldVal: 2 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 1 }]
				]
			},
			{
				initialData: [ "hi" ],
				method: "splice",
				args: [ 0, 1 ],
				events: [
					{ type: "length", newVal: 0, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 1, insert: [] }]
				]
			},
			{
				initialData: [ "there" ],
				method: "splice",
				args: [ 0, 0, "hi" ],
				events: [
					{ type: 1, newVal: "there", oldVal: undefined },
					{ type: 0, newVal: "hi", oldVal: "there" },
					{ type: "length", newVal: 2, oldVal: 1 }
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 0, insert: ["hi"] }],
				]
			},
			{
				initialData: [ "hi" ],
				method: "splice",
				args: [ 0, 1, "hello", "there" ],
				events: [
					{ type: 0, newVal: "hello", oldVal: "hi" },
					{ type: 1, newVal: "there", oldVal: undefined },
					{ type: "length", newVal: 2, oldVal: 1 },
				],
				patches: [
					[{ type: "splice", index: 0, deleteCount: 1, insert: ["hello", "there"] }],
				]
			}
		];

		class Arr extends DefineArray {
			static get items() {
				return String;
			}
		}
		testSteps.forEach((step) => {
			// get the data for the step
			const { method, args, events, patches, initialData = [] } = step;

			const arr = new Arr(...initialData);
			const actualEvents = [], actualPatches = [];

			[0, 1, 2, 3, 5, 6].forEach((index) => {
				canReflect.onKeyValue(arr, index, (newVal, oldVal) => {
					actualEvents.push({ type: index, newVal, oldVal });
				});
			});

			canReflect.onKeyValue(arr, "length", (newVal, oldVal) => {
				actualEvents.push({ type: "length", newVal, oldVal });
			});

			canReflect.onPatches(arr, (patches) => {
				actualPatches.push(patches);
			});

			// call the method from the step
			arr[method].apply(arr, args);

			// check that the correct events and patches were dispatched
			assert.deepEqual(actualEvents, events, `arr[${method}](${args.join(",")}) dispatched correct events`);
			assert.deepEqual(actualPatches, patches, `arr[${method}](${args.join(",")}) dispatched correct patches`);
		});

	});
};
