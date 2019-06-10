@function can-define-array/array.prototype.filter filter
@parent can-define-array/prototype

Filter an array returning a subset of the items based on a predicate.

@signature `filter(fn)`

  Filter an array of items based on a function predicate.

  ```js
  import { DefineArray, DefineObject } from "can/everything";

  class Cartoon extends DefineObject {
    static define = {
      title: String,
      studio: String
    }
  }

  class Cartoons extends DefineArray {
    static items = Cartoon;
  }

  let toons = new Cartoons(
    { title: "Looney Tunes", studio: "Warner Bros." },
    { title: "Darkwing Duck", studio: "Disney" },
    { title: "Merrie Melodies", studio: "Warner Bros." },
    { title: "Mickey Mouse", studio: "Disney" },
    { title: "The Flintstones", studio: "Hanna-Barbera" }
  );

  let filtered = toons.filter(cartoon => cartoon.title === "The Flintstones");
  console.log( filtered );
  // -> [ { title: "The Flintstones", studio: "Hanna-Barbera" } ]
  ```
  @codepen

  @param {function():Boolean} fn A predicate function that will be run for each item in the array. If the function returns true, the item will be included in the filtered resultset.

  @return {DefineArray} A `DefineArray` matching the type of the original array.

@signature `filter(props)`

  Filter an array of items that match a subset of properties. A match will be made if any properties provided to `props` are within an item.

  ```js
  import { DefineArray, DefineObject } from "can/everything";

  class Cartoon extends DefineObject {
    static define = {
      title: String,
      studio: String
    }
  }

  class Cartoons extends DefineArray {
    static items = Cartoon;
  }

  let toons = new Cartoons(
    { title: "Looney Tunes", studio: "Warner Bros." },
    { title: "Darkwing Duck", studio: "Disney" },
    { title: "Merrie Melodies", studio: "Warner Bros." },
    { title: "Mickey Mouse", studio: "Disney" },
    { title: "The Flintstones", studio: "Hanna-Barbera" }
  );

  let filtered = toons.filter({ studio: "Warner Bros." });
  console.log( filtered.length ); // -> 2
  console.log( filtered );
  ```
  @codepen

  @param {{}} props  An object of properties to be matched against.
  @return {DefineArray} A `DefineArray` matching the type of the original array.
