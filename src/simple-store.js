import {
  of,
  BehaviorSubject,
  Subject,
  merge,
  identity,
  isObservable,
  concat,
  noop,
  EMPTY,
} from 'rxjs';
import {
  distinctUntilChanged,
  withLatestFrom,
  map,
  switchMap,
  share,
  take,
} from 'rxjs/operators';
import * as defaultDeps from './default-deps';
import { isPromise } from './utils';

const ACTION$ = Symbol('action$');
const STATE$ = Symbol('state$');
const DERIVED$ = Symbol();
const DEPS$ = Symbol();
const DEPS_SUB = Symbol();

export class SimpleStore {
  constructor(storeFn, deps) {
    const state$ = new BehaviorSubject();
    const deps$ = new BehaviorSubject({ ...defaultDeps, ...deps });
    const action$ = new Subject();

    const derived$ = merge(
      action$.pipe(
        // startWith(undefined),
        withLatestFrom(state$),
        withLatestFrom(deps$),
        map(([[action, state], deps]) => {
          return [state, action, deps];
        })
      ),
      deps$.pipe(
        withLatestFrom(state$),
        map(([deps, state]) => [state, undefined, deps])
      )
    ).pipe(
      switchMap(args => {
        const resolves$ = new BehaviorSubject();
        const resolve = v => resolves$.next(v);
        //******* THE MAGIC HAPPENS HERE ***********/
        const result = storeFn(...args, resolve);
        //******************************************/
        const resolved = resolves$.getValue() ? resolves$.pipe(take(1)) : EMPTY;
        if (isPromise(result)) {
          // always emit undefined/resolved values when pending on promise
          return concat(resolved, result);
        }
        return concat(resolved, isObservable(result) ? result : of(result));
      }),
      share()
    );

    Object.defineProperties(this, {
      [STATE$]: { value: state$, configurable: true },
      [ACTION$]: { value: action$, configurable: true },
      [DERIVED$]: { value: derived$, configurable: true },
      [DEPS$]: { value: deps$, configurable: true },
      // TODO: is there a problem holding on to the deps subscription like this
      [DEPS_SUB]: { value: deps$.subscribe(noop), configurable: true },
    });
  }
  get state() {
    return this[STATE$].getValue();
  }
  set state(newState) {
    this[STATE$].next(newState);
  }
  subscribe(next, error, filter) {
    // stores never complete
    // TODO: handle error in a non-completing way
    const subscription = this[DERIVED$].subscribe(this[STATE$]);
    const stateSliceSub = this[STATE$].pipe(
      filter ? map(filter) : identity,
      distinctUntilChanged()
    ).subscribe(next, error);

    // for svelte
    const unsub = () => {
      subscription.unsubscribe();
      stateSliceSub.unsubscribe();
    };
    // or RxJS / ECMAScript
    unsub.unsubscribe = () => {
      subscription.unsubscribe();
      stateSliceSub.unsubscribe();
    };
    return unsub;
  }
  dispatch(action) {
    this[ACTION$].next(action);
  }
  setDeps(deps) {
    this[DEPS$].next({ ...defaultDeps, ...deps });
  }
}

export const createSimpleStore = (storeFn, deps) => {
  return new SimpleStore(storeFn, deps);
};
