import { createSimpleStore } from '../src/index';
import * as defaultDeps from '../src/default-deps';
import { from } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { defer } from '../src/utils';

describe('SimpleStore', () => {
  describe('createSimpleStore', () => {
    test('when subscribed to, should start with initial state returned by storeFn', done => {
      const expected = [];
      const store = createSimpleStore(state => {
        expect(state).toBeUndefined();
        return expected;
      });
      store.subscribe(state => {
        expect(state).toBe(expected);
        done();
      }, done);
    });

    test('when deriving state from storeFn, the default deps should be provided by default', () => {
      createSimpleStore((state = [], action, deps) => {
        expect(deps).toEqual(defaultDeps);
        return state;
      });
    });

    test('it providing a deps argument should add those deps to the default deps in storeFn', () => {
      createSimpleStore(
        (state = [], action, deps) => {
          expect(deps).toEqual({ ...defaultDeps, foo: 'bar' });
          return state;
        },
        { foo: 'bar' }
      );
    });

    test('should accept an async storeFn, returning undefined while the promise is pending', done => {
      const expected = [];
      const store = createSimpleStore(async () => {
        return expected;
      });
      let first = true;
      store.subscribe(state => {
        if (first) {
          expect(state).toBe(undefined);
          first = false;
        } else {
          done();
        }
      }, done);
      expect(store.state).toBeUndefined();
    });

    test('calling resolve() in an async storeFn should emit resolved then the promise value', done => {
      const storeFn = async (state, action, deps, resolve) => {
        resolve([1]);
        return [2];
      };
      const store = createSimpleStore(storeFn);
      let first = true;
      store.subscribe(state => {
        if (first) {
          expect(state).toEqual([1]);
          first = false;
        } else {
          expect(state).toEqual([2]);
          done();
        }
      }, done);
      // TODO: use callback.mock.calls
      // resolve, resolves synchronously
      expect(store.state).toEqual([1]);
    });

    test('when actions are dispatched, use storeFn to define new state', done => {
      const store = createSimpleStore((state = 0, action) => {
        if (action === 'inc') {
          return state + 1;
        }
        return state;
      });
      let count = 0;
      // before subscribing, state has not been determined
      expect(store.state).toBeUndefined();
      store.subscribe(state => {
        expect(state).toBe(count++);
        if (count === 2) {
          done();
        }
      }, done);
      expect(store.state).toBe(0);
      store.dispatch('inc');
      expect(store.state).toBe(1);
      store.dispatch('inc');
      expect(store.state).toBe(2);
    });

    test('when actions are when the same state is returned, the next callback is not called', () => {
      let count = 0;
      const store = createSimpleStore((state = [], action) => {
        if (action) {
          count++;
        }
        return state;
      });
      const callback = jest.fn();
      store.subscribe(callback);
      store.dispatch('inc');
      store.dispatch('inc');
      store.dispatch('inc');
      expect(callback.mock.calls.length).toBe(1);
      expect(count).toBe(3);
    });

    test('store should retain state, even if all subscribers unsubscribe', done => {
      const store = createSimpleStore((state = 0, action) => {
        if (action === 'inc') {
          return state + 1;
        }
        return state;
      });
      // before subscribing, state has not been determined
      expect(store.state).toBeUndefined();
      let count = 0;
      const unsubscribe = store.subscribe(state => {
        expect(state).toBe(count++);
      }, done);
      expect(store.state).toBe(0);
      store.dispatch('inc');
      expect(store.state).toBe(1);
      store.dispatch('inc');
      expect(store.state).toBe(2);
      unsubscribe();
      expect(store.state).toBe(2);
      store.subscribe(state => {
        expect(state).toBe(2);
        done();
      }, done);
    });

    test('has an imperative state setter, (could be used for resetting state)', () => {
      const expected = { newState: true };
      const store = createSimpleStore((state = []) => {
        return state;
      });
      let first = true;
      store.subscribe(state => {
        if (first) {
          expect(state).toEqual([]);
          first = false;
        } else {
          expect(state).toBe(expected);
        }
      });
      store.state = expected;
    });

    test('can be unsubscribed by either calling the subscription() or calling subscription.unsubscribe()', () => {
      const store = createSimpleStore((state = 0, action) => {
        if (action === 'inc') {
          return state + 1;
        }
        return state;
      });
      // before subscribing, state has not been determined
      expect(store.state).toBeUndefined();
      let count = 0;
      const subscription = store.subscribe(state => {
        expect(state).toBe(count++);
      });

      expect(store.state).toBe(0);
      store.dispatch('inc');
      expect(store.state).toBe(1);
      subscription();
      // further dispatches do not affect the stores state
      store.dispatch('inc');
      store.dispatch('inc');
      expect(store.state).toBe(1);
      let newCount = 1;
      const newSubscription = store.subscribe(state => {
        expect(state).toBe(newCount++);
      });
      store.dispatch('inc');
      newSubscription.unsubscribe();
      // further dispatches do not affect the stores state
      store.dispatch('inc');
      store.dispatch('inc');
      expect(store.state).toBe(2);
    });

    test('if deps are updated AFTER subscription, storeFn will be called with no action and new deps', () => {
      const store = createSimpleStore((state = [], action, deps) => {
        // console.log('deps', deps);
        if (deps.foo === 'bar') {
          expect(action).toBeUndefined();
          expect(state.length).toBe(2);
        }
        return [...state, state.length + 1];
      });
      store.subscribe(() => {});
      store.dispatch('action');
      store.setDeps({ foo: 'bar' });
    });

    test('store implements an RxJS observable interface, so calling .pipe() and passing rxjs operators works as expected', () => {
      const store = createSimpleStore((state = {}, action) => {
        if (action) {
          return {
            ...state,
            [action]: state[action] !== undefined ? state[action] + 1 : 0,
          };
        }
        return state;
      });
      const callback = jest.fn();
      store
        .pipe(
          map(state => state.A),
          distinctUntilChanged()
        )
        .subscribe(callback, err => {
          throw err;
        });
      store.dispatch('B');
      store.dispatch('A');
      store.dispatch('B');
      store.dispatch('A');
      store.dispatch('B');
    });

    test('if storeFn return an RxJS observable, follow that observable for state', async () => {
      const expected = from([1, 2, 3]);
      const store = createSimpleStore((state = {}, action) => {
        if (action) {
          return expected;
        }
        return state;
      });
      const callback = jest.fn();
      store.subscribe(callback, err => {
        throw err;
      });
      store.dispatch('ACTION');
      await expected.toPromise();
      expect(callback.mock.calls).toEqual([[{}], [1], [2], [3]]);
    });

    test('resolve()', async done => {
      const deferred = defer();
      const store = createSimpleStore((state, action, deps, resolve) => {
        resolve(1);
        return deferred;
      });
      const callback = jest.fn();
      store.subscribe(callback, done);
      expect(callback.mock.calls).toEqual([[1]]);
      deferred.resolve(2);
      await deferred;
      expect(callback.mock.calls).toEqual([[1], [2]]);
      done();
    });

    test(`resolve() can be called multiple times, but only the last call get's emitted as state`, async done => {
      const deferred = defer();
      const store = createSimpleStore((state, action, deps, resolve) => {
        resolve(1);
        resolve(2);
        resolve(3);
        return deferred;
      });
      const callback = jest.fn();
      store.subscribe(callback, done);
      expect(callback.mock.calls).toEqual([[3]]);
      deferred.resolve({ foo: 'bar' });
      await deferred;
      expect(callback.mock.calls).toEqual([[3], [{ foo: 'bar' }]]);
      done();
    });

    test('if you call dispatch with more than one argument, the storeFn receives an array for the action argument', () => {
      const storeFn = jest.fn((state = {}) => {
        return state;
      });
      const store = createSimpleStore(storeFn);
      const unsub = store.subscribe(() => {});

      store.dispatch('one');
      store.dispatch('one', 'two');
      store.dispatch('one', ['three', 'four']);

      unsub();

      const actionArguments = storeFn.mock.calls.map(([, action]) => action);
      expect(actionArguments).toEqual([
        undefined,
        'one',
        ['one', 'two'],
        ['one', ['three', 'four']],
      ]);
    });
  });
});
