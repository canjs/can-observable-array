const ObservableArray = require("../src/can-observable-array");
const QUnit = require("steal-qunit");

QUnit.module('can-observable-array-class-fields');

QUnit.test("Class properties default value", function(assert) {
	const done = assert.async();

	class MyList extends ObservableArray {
		/* jshint ignore:start */
		prop = ['foo', 'bar'];
		/* jshint ignore:end */
	}

	const aList = new MyList();
	assert.deepEqual(aList.prop,  ['foo', 'bar'], 'Default value works');
	
	aList.on('prop', function(ev, newVal, oldVal) {
		assert.deepEqual(oldVal, ['foo', 'bar'], 'Old value is correct');
		assert.deepEqual(newVal, ['baz'], 'Value is updated');
		assert.ok(ev, 'Age is observable');
		done();
	});

 	aList.prop =  ['baz'];
});


QUnit.test('Throws on class field property named items', function (assert) {
	class MyList extends ObservableArray {
		/* jshint ignore:start */
		items = ['foo', 'bar'];
		/* jshint ignore:end */

		static get items() {
			return String;
		}
	}

	try {
		new MyList();
	} catch (error) {
		assert.ok(error, 'it throws');
		assert.equal(
			error.message, 
			'ObservableArray does not support a class field named items. Try using a different name or using static items',
			'Message is correct'
		);
	}

});

QUnit.test('handle descriptor getter', function(assert) {
	assert.expect(4);

	const foo = new ObservableArray();

	let _bar = "Hello";
	Object.defineProperty(foo, "bar", {
		get() {
			return _bar;
		},
		set(val) {
			_bar = val;
		}
	});
	
	assert.equal(foo.bar, 'Hello');

	foo.on('bar', function (ev, newVal, oldVal) {
		assert.equal(oldVal, 'Hello', 'Old value is correct');
		assert.equal(newVal, 'Hola', 'Value is updated');
		assert.ok(ev, 'The class field is observable');
	});

	foo.bar = 'Hola';
});