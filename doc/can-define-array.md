@module {function} can-define-array
@parent can-observables
@collection can-ecosystem
@group can-define-array/static 0 static
@group can-define-array/prototype 1 prototype
@alias can.DefineArray
@templateRender true

@description Create observable arrays with defined properties.

@signature `class extends DefineArray`

  Creates a derived class extending from `DefineArray`. Useful for creating typed lists to use with associated typed [can-define-object objects].

  ```js
  import { DefineArray, DefineObject } from "can/everything";

  class Todo extends DefineObject {
    static define = {
      label: String
    };
  }

  class TodoList extends DefineArray {
    static items = Todo;
  }

  let todos = new TodoList(
    { label: "Walk the dog" },
    { label: "Make dinner" }
  )

  console.log(todos[0] instanceof Todo); // -> true
  ```
  @codepen

  @return {Constructor} An extended `DefineArray` constructor with definitions from [can-define-object/object.static.define].

@signature `new DefineArray(...[items])`

  Creates an instance of a DefineArray or an extended DefineArray with enumerated properties from `items`.

  ```js
  import { DefineArray } from "can/everything";

  const people = new DefineArray(
  	{ first: "Justin", last: "Meyer" },
  	{ first: "Paula", last: "Strozak" }
  );
  ```

  @return {can-define-array} An instance of `DefineArray` with the values from _items_.

@body

## Mixed-in instance methods and properties

Instances of `DefineArray` have all methods and properties from
[can-event-queue/map/map]:

{{#each (getChildren [can-event-queue/map/map])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyArray extends DefineArray {
  static items = String;
}

const listInstance = new MyArray("a", "b");

listInstance.on( "length", function( event, newLength, oldLength ) { /* ... */ } );
```


## Mixed-in type methods and properties

Extended `DefineArray` classes have all methods and properties from
[can-event-queue/type/type]:

{{#each (getChildren [can-event-queue/type/type])}}
- [{{name}}] - {{description}}{{/each}}

Example:

```js
class MyArray extends DefineArray {
  static items = String;
}

canReflect.onInstancePatches( MyList, ( instance, patches ) => {

} );
```

## Use

The `can-define-array` package exports a `DefineArray` class.  It can be used
with `new` to create observable lists.  For example:

```js
import { DefineArray } from "can/everything";
const list = new DefineArray( [ "a", "b", "c" ] );
console.log(list[ 0 ]); //-> "a";

list.push( "x" );
console.log(list.pop()); //-> "x"
```
@codepen

It can also be extended to define custom observable list types with `extends`.  For example, the following defines a `StringList` type where every item is converted to a string by specifying the [can-define-array/static.items items definition]:

```js
import { DefineObject, type } from "can/everything";

class StringList extends DefineObject {
  static items = {
    type: type.convert(String)
  }
}

const strings = new StringList( [ 1, new Date( 1475370478173 ), false ] );

console.log(strings[ 0 ]); //-> "1"
console.log(strings[ 1 ]); //-> "Sat Oct 01 2016 20:07:58 GMT-0500 (CDT)"
console.log(strings[ 2 ]); //-> "false"
```
@codepen

Non-numeric properties can also be defined on custom DefineArray type.  The following
defines a `completed` property that returns the completed todos:

```js
import { DefineList, DefineMap } from "can";
import { DefineArray, DefineObject } from "can/everything";

class Todo extends DefineObject {
  static define = {
    complete: false
  };
}

class TodoList extends DefineArray {
  static items = Todo;
  get completed() {
    return this.filter( { complete: true } );
  }
}

const todos = new TodoList( [ { complete: true }, { complete: false } ] );
console.log(todos.completed.length); //-> 1
```
@codepen

Finally, DefineList instances are observable, so you can use the [can-event-queue/map/map]
methods to listen to its [can-define-array/AddEvent],
[can-define-array/LengthEvent], [can-define-array/RemoveEvent],
and [can-define-array/PropertyNameEvent] events:

```js
import { DefineArray } from "can/everything";
const people = new DefineArray( "alice", "bob", "eve" );

people.on( "add", ( ev, items, index ) => {
	console.log( "add", items, index );
} ).on( "remove", ( ev, items, index ) => {
	console.log( "remove", items, index );
} ).on( "length", ( ev, newVal, oldVal ) => {
	console.log( "length", newVal, oldVal );
} );

people.pop(); // remove ["eve"] 2
// length 2 3

people.unshift( "Xerxes" ); // add ["Xerxes"] 1
// length 3 2
```
@codepen
