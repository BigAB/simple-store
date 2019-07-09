import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
  useRef,
  memo,
} from 'react';
import { SimpleStore } from './simple-store';

export function createSimpleStoreHook(storeFn, options) {
  const context = createContext(new SimpleStore(storeFn, options.deps));

  const Provider = memo(({ children, ...props }) => {
    const storeRef = useRef(
      new SimpleStore(storeFn, { ...options.deps, ...props })
    );
    useLayoutEffect(() => {
      storeRef.current.setDeps({ ...options.deps, ...props });
    }, [props]);
    return React.createElement(
      context.Provider,
      { value: storeRef.current },
      children
    );
  });

  const useSimpleStore = (localFilter, inputs = []) => {
    const store = useContext(context);
    const filter = useCallback(localFilter, inputs);
    const initialState = useMemo(() => {
      return filter ? filter(store.getState()) : store.getState();
    }, [filter, store]);
    const [state, setState] = useState(initialState);
    const unsub = useMemo(() => {
      return store.subscribe(
        s => setState(s),
        e => {
          throw e;
        },
        filter
      );
    }, [setState, filter, store]);

    useEffect(() => unsub, [unsub]);
    return [state, store.dispatch];
  };

  return [useSimpleStore, Provider];
}
