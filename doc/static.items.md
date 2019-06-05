@property {can-define-object/object.types.property} can-define-array/static.items items
@parent can-define-array/static

@description Define default behavior for items in the list.

@option {can-define-object/object.types.property}

  By defining an `items` property, this will supply a
  default behavior for items in the list.

  Setting the wildcard is useful when items should be converted to a particular type.

  ```js
import { DefineArray, DefineObject } from "can/everything";

  class Person extends DefineObject { /* ... */ }
  class People extends DefineArray {
    static items = Person;
  }

  let scientists = new People(
    { first: "Ada", last: "Lovelace" },
    { first: "John", last: "McCarthy" }
  );

  console.log(scientists[0] instanceof Person);
  // -> true
  ```
  @codepen
