@property can-define-array/array.static.propertyDefaults propertyDefaults
@parent can-define-array/static

@description Specify default behaviors for properties on a DefineArray.

@signature `static propertyDefaults = PROPDEFINITION`

  Specify default values using a [can-define-object/object.types.propDefinition] object.

  ```js
  import { DefineArray, DefineObject, type } from "can/everything";

  class Player extends DefineObject {

  }

  class Players extends DefineArray {
    static propertyDefaults = {
      type: type.convert(Number)
    };

    static items = Player;
  }

  const team = new Players();
  team.rank = "5";

  console.log(team.rank); // -> 5
  ```
  @codepen

  The above specifies a RouteData type whose properties default to a strictly typed `String` and are [can-define-object/define/enumerable non-enumerable].

@signature `static propertyDefaults = PROPERTY`

  propertyDefaults can be specified using any of the methods specified by the [can-define-object/object.types.property property type].

  ```js
  import { DefineArray } from "can/everything";

  class People extends DefineArray {
    static propertyDefaults = String;
  }
  ```

  The above specifies all properties to default to being a strictly defined `String`. See [can-define-object/object.types.property] for other possible values.

  This does *not* set the type for items within the array. Use [can-define-array/static.items] for that.
