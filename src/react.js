import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useContext,
  createContext,
  useRef,
  memo,
} from 'react';
import { SimpleStore } from './simple-store';
import { map, distinctUntilChanged } from 'rxjs/operators';

export function createSimpleStoreHook(storeFn, options = {}) {
  const context = createContext(new SimpleStore(storeFn, options.deps));

  const Provider = memo(({ children, ...props }) => {
    const storeRef = useRef();
    if (!storeRef.current) {
      storeRef.current = new SimpleStore(storeFn, {
        ...options.deps,
        ...props,
      });
    }
    useLayoutEffect(() => {
      storeRef.current.setDeps({ ...options.deps, ...props });
    }, [props]);

    return React.createElement(
      context.Provider,
      { value: storeRef.current },
      children
    );
  });
  Provider.displayName = 'SimpleStoreProvider';

  const useSimpleStore = (selector = ident, inputs = []) => {
    const store = useContext(context);
    const mapWithSelector = useCallback(selector, inputs);

    const [state, setState] = useState();
    const dispatch = useCallback(action => store.dispatch(action), [store]);

    useEffect(() => {
      const subscription = store
        .pipe(
          map(selector),
          distinctUntilChanged()
        )
        .subscribe(
          state => setState(state),
          error => {
            throw error;
          },
          () => {
            throw Error('Store observables should not complete');
          }
        );
      return () => {
        subscription();
      };
    }, [setState, mapWithSelector, store]);

    return [state, dispatch];
  };

  return [useSimpleStore, Provider];
}

const ident = x => x;
