const QUnit = require("steal-qunit");
const DefineArray = require("./src/can-define-array");

QUnit.test("mixinProxyArray adds proxyability to arrays", function(assert) {
	class Todos extends DefineArray() {}

	let todos = new Todos();

	canReflect.onKeyValue(todos, 0, () => {
		debugger;
	});

	todos.push("get this working");
});
