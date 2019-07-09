import {
  of,
  BehaviorSubject,
  Subject,
  merge,
  identity,
  isObservable,
  concat,
  noop,
} from 'rxjs';
import {
  distinctUntilChanged,
  withLatestFrom,
  map,
  switchMap,
  share,
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

    const distinctState$ = state$.pipe(distinctUntilChanged());
    const distinctDeps$ = deps$.pipe(distinctUntilChanged());
    const depsWithState$ = distinctDeps$.pipe(withLatestFrom(distinctState$));

    const actionWithStateAndDeps$ = action$.pipe(
      withLatestFrom(distinctState$),
      withLatestFrom(distinctDeps$),
      map(([[action, state], deps]) => {
        return [state, action, deps];
      })
    );

    const updates$ = merge(
      actionWithStateAndDeps$,
      depsWithState$.pipe(map(([deps, state]) => [state, undefined, deps]))
    );

    const derived$ = updates$.pipe(
      switchMap(args => {
        //******* THE MAGIC HAPPENS HERE ***********/
        const result = storeFn(...args);
        //******************************************/
        if (isPromise(result)) {
          // always emit undefined when pending on promise
          return concat(of(undefined), result);
        }
        return isObservable(result) ? result : of(result);
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
