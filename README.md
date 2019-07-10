# Simple-Store

Sometimes, you just need a simple store.

## Just a function

This library let's you create a flux-like store out of just a function, and use that store in your React or Svelte apps.

[![Build Status](https://travis-ci.com/BigAB/simple-store.svg?branch=master)](https://travis-ci.com/BigAB/simple-store)

## Code Example

```js
const store = createStore(async (state, action, deps, resolve) => {
  if ((!state && !action) || action.type === 'reset') {
    resolve({ loading: true });
    const response = await deps.fetch('https://example.com/api/things');
    const { data: things } = await resonse.json();
    return { things, loading: false };
  }
  if (action.type === 'filter') {
    const category = action.payload.category.id;
    resolve({ ...state, loading: true });
    const response = await deps.fetch(
      `https://example.com/api/things/${category}`
    );
    const { data: things } = await resonse.json();
    return { things, loading: false, category };
  }
  return state;
});
```

## Installation

```sh
npm install @bigab/simple-store
```

```sh
yarn add @bigab/simple-store
```

## Features

- create a flux store from a function
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
