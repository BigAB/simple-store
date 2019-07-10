export const isPromise = value =>
  value &&
  typeof value.subscribe !== 'function' &&
  typeof value.then === 'function';

export const defer = () => {
  let resolve, reject;
  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  p.resolve = resolve;
  p.reject = reject;
  return p;
};
