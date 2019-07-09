export const isPromise = value =>
  value &&
  typeof value.subscribe !== 'function' &&
  typeof value.then === 'function';
