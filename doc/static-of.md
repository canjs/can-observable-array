@property can-observable-array/array.static.of of
@parent can-observable-array/static

@description Static method to create an ObservableArray.

@signature `ObservableArray.of(<TYPE>)`

  Returns an `ObservableArray` constructor which can be used to define the [can-observable-object#Typedproperties Typed properties].

  ```html
  <my-app></my-app>
  <script type="module">
  import { ObservableArray, ObservableObject, StacheElement, type } from "//unpkg.com/can@5/everything.mjs";

  class Person extends ObservableObject {
    static define = {
      name: String
    }
  }

  class MyApp extends StacheElement {
    static get props () {
      return {
        people: ObservableArray.of(type.convert(Person))
      }
    }
    static view = `
      {{# for(person of people) }}
        Welcome {{ person.name }}
      {{/ for }}
    `
  }
  customElements.define('my-app', MyApp);

  const app = document.querySelector('my-app');
  app.people.push({ name: 'Matt' });
  </script>
  ```
  @codepen
