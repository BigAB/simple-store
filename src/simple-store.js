import {
  of,
  BehaviorSubject,
  Subject,
  isObservable,
  concat,
  EMPTY,
} from 'rxjs';
import {
  distinctUntilChanged,
  withLatestFrom,
  map,
  switchMap,
  share,
  take,
  startWith,
  tap,
} from 'rxjs/operators';
import * as defaultDeps from './default-deps';
import { isPromise } from './utils';

export function SimpleStore(storeFn, deps) {
  const state$ = new BehaviorSubject();
  const deps$ = new BehaviorSubject({ ...defaultDeps, ...deps });
  const action$ = new Subject();

  const store$ = action$.pipe(startWith(undefined)).pipe(
    withLatestFrom(state$.pipe(distinctUntilChanged())),
    withLatestFrom(deps$),
    map(([[action, state], deps]) => [state, action, deps]),
    switchMap(([state, action, deps]) => {
      const resolves$ = new BehaviorSubject();
      const resolve = v => resolves$.next(v);
      //******* THE MAGIC HAPPENS HERE ***********/
      const result = storeFn(state, action, deps, resolve);
      //******************************************/
      // an observable of the last call made to resolve in the storeFn or EMPTY
      const resolved$ =
        resolves$.getValue() === undefined ? EMPTY : resolves$.pipe(take(1));
      if (isPromise(result)) {
        return concat(
          // always emit undefined/resolved values when pending on promise
          resolved$ === EMPTY ? of(undefined) : resolved$,
          result
        );
      }
      // always turn result into an observable, so that array results
      // don't get each item emitted separately
      const result$ = isObservable(result) ? result : of(result);
      // if there were no resolve calls, concat empty for no emit
      return concat(resolved$, result$);
    }),
    tap(state => state$.next(state)),
    distinctUntilChanged(),
    share()
  );

  return Object.create(store$, {
    state: {
      get() {
        return state$.getValue();
      },
      set(state) {
        return state$.next(state);
      },
      configurable: true,
      enumerable: true,
    },
    dispatch: {
      value: function dispatch(action) {
        action$.next(action);
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    setDeps: {
      value() {
        deps$.next({ ...defaultDeps, ...deps });
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
    subscribe: {
      value: function subscribe(...args) {
        // handle both styles of unsub
        const sub = store$.subscribe(...args);
        const subscription = () => sub.unsubscribe();
        subscription.unsubscribe = subscription;
        return subscription;
      },
      writable: true,
      configurable: true,
      enumerable: true,
    },
  });
}

export { SimpleStore as createSimpleStore };
