# Simple-Store

Sometimes, you just need a simple store.

## Just a function

This library let's you create a flux-like store out of just a function, and use that store in your React or Svelte apps.

[![Build Status](https://travis-ci.com/BigAB/simple-store.svg?branch=master)](https://travis-ci.com/BigAB/simple-store)

## Code Example

#### Create a store

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

  // by default, jsut return the same state and nothing happens
  return state;
});
```

## create a store hook for `React`

```jsx
// could be in another file
const useThings = createSimpleStoreHook(thingsStoreFn); // see example above

const ThingList = ({ category }) => {
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
            dispatch(createCategoryFilterAction(category));
          }}
        />
      ))}
    </>
  );
};
```

## use your store in a Svelte component

```js
// coming soon
```

## Installation

```sh
npm install @bigab/simple-store
```

```sh
yarn add @bigab/simple-store
```

## Features

- create a flux store from a simple function
- async by default
- framework agnostic

## API Reference

### `createSimpleStore(storeFn, deps)`

### `storeFn: (state[, action, deps, resolve]) => {}`

## Tests

```
npm test
```

## Built with

- [RxJS](https://rxjs.dev/)
- ❤️

## Contribute

Let people know how they can contribute into your project. A [contributing guideline](./CONTRIBUTING.md) will be a big plus.

## License

MIT © [Adam L Barrett](adamlbarrett.com)
