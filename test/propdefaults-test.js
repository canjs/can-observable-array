const DefineArray = require("../src/can-define-array");
const DefineObject = require("can-define-object");
const QUnit = require("steal-qunit");
const type = require("can-type");

module.exports = function() {
	QUnit.module("ExendedDefineArray.propertyDefaults");

	QUnit.test("Does type conversion", function(assert) {
		class Players extends DefineArray {
		  static propertyDefaults = {
			type: type.convert(Number)
		  };
		}

		const team = new Players();
		team.rank = "5";

		assert.deepEqual(team.rank, 5);
	});
};
