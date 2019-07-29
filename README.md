# Simple-Store

Sometimes, you just need a simple store.

## Just a function

This library let's you create a flux-like store out of just a function, and use that store in your React or Svelte apps.

[![Build Status](https://travis-ci.com/BigAB/simple-store.svg?branch=master)](https://travis-ci.com/BigAB/simple-store)

## Code Example

### Create a store

```js
import { createSimpleStoreHook } from '@bigab/simple-store';

const store = createSimpleStoreHook(async (state, action, deps, resolve) => {
  // if the store is being subscribed to, or the action is 'reset'
  if ((!state && !action) || action.type === 'reset') {
    // early sync resolve so you can show a spinner or something
    resolve({ loading: true });

    // then fetch the data for your store
    const response = await deps.fetch('https://example.com/api/things');
    const { data: things } = await resonse.json();

    // then return to set new state again
    return { things, loading: false }; // turn off spinner and show data
  }

  // if a filter action is dipatched fetch only things for that category
  if (action.type === 'filter') {
    const category = action.payload.category.id;

    // still show the current items, along with the spinner
    resolve({ ...state, loading: true });

    // until the filter request resolves
    const response = await deps.fetch(
      `https://example.com/api/things/${category}`
    );
    const { data: things } = await resonse.json();

    return { things, loading: false, category };
  }

  // by default, just return the same state and nothing happens
  return state;
});
```

### Create a store hook for `React`

```jsx
import { createSimpleStoreHook } from '@bigab/simple-store/react';

// this could likely be in another file
// thingsStoreFn is the storeFn from example above
const useThings = createSimpleStoreHook(thingsStoreFn);

const ThingList = ({ category }) => {
  // hook returns [state, dispatch] tuple, just like useReducer
  const [{ things, loading }, dispatch] = useThings();

  if (loading) {
    return <Spinner />;
  }
  return (
    <>
      {things.map(thing => (
        <Thing
          key={thing.id}
          thing={thing}
          onSelectCategory={() => {
            dispatch({ type: 'filter', payload: { category } });
          }}
        />
      ))}
    </>
  );
};
```

### Use your store in a `Svelte` component

```js
// example coming soon, but just swap out a Svelte store
```

## Installation

`@bigab/simple-store` requires `rxjs` as a **peer dependency**.

```sh
npm install @bigab/simple-store rxjs
```

```sh
yarn add @bigab/simple-store rxjs
```

Also, if you are importing from `@bigab/simple-store/react` you will require a **peer dependency** of `react`.
And of course if you are importing from `@bigab/simple-store/svelte` you will require a **peer dependency** of `svelte`.

## Features

- create a flux store from a simple function
- async by default
- framework agnostic

## API Reference

#### `createSimpleStore(storeFn, deps) => store`

`createSimpleStore` is the most basic way to create an observable flux store. You pass in a function (`storeFn`) which defines how state is derived any dispatched actions (or when instatiated).

You can optionally also pass in any dependencies (`deps`) the function may require, as an object, so that you may swap those dependencies out, for testing or any other reason you need, to change the beahviour of the store. Deps helps decouple your store from certain aspects, for example: your data retrieval and storage, as well as many other useful things.

#### `storeFn: (state[, action, deps, resolve]) => newState`

This `storeFn` function, essentially becomes the store, deriving state from any actions that are dispatched into it. When called initially, it will have `undefined` for both state and action, and from then on, any calls to `store.dispatch()` will re-invoke this `storeFn` with the current `state`, the `action` dispatched, any `deps` provided to the store initially or by DI, and an optional `resolve` function, used to set state synchronously while you wait for async state to return.

`storeFn` is **async by default**, so using `async`/`await` is perfectly okay and encouraged, as is returning a promise, or even an RxJS observable.

### React

To line up with the React way of doing things, SimpleStore exports function called `createSimpleStoreHook` which will create a hook/provider pair, which internally use a SimpleStore instance.

#### `createSimpleStoreHook(storeFn[, options = { deps }]) => useStoreHook`

To create the hook, the arguments are the `storeFn` (just like creating a store instance), and an optional `options` object. The options will have a property `{ deps }`, which can be used to provide `deps` to the underlying `store`, with the added benefit of being able to swap out deps in your React apps using the context API.

`createSimpleStoreHook` returns a `useStoreHook` which is described below.

#### `useStoreHook(stateSelector[, deps = []]) => [state, dispatch]`

The `useStoreHook` is to be used in React function components, providing the stores current `state` and `dispatch` method to the component, similar to `useReducer`.

It also accepts a `stateSelector` function, which is basically a mapping of the `store` state to the components local state, so that component updates and re-renders can be limited to the particular slice of state this component is subscribing to.

The `deps` array offers a way to change the `stateSelector`, just like the `deps` params in `useEffect()`, `useMemo()`, `useCallback()` and `useImperativeHandle()` and `useLayoutEffect()`, but defaults to an empty array `[]` rather than undefined.

## Tests

If you are curious about the requirements or test coverage, you can pull down the repo and run:

```
npm test
```

...to get an idea of what is being tested and the general idea of code coverage.

## Built with

- [RxJS](https://rxjs.dev/)
- ❤️

## Contribute

Let people know how they can contribute into your project. A [contributing guideline](./CONTRIBUTING.md) will be a big plus.

## License

MIT © [Adam L Barrett](adamlbarrett.com)
