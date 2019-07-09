import { of, isObservable, concat } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ajax as rxajax } from 'rxjs/ajax';
import { fromFetch } from 'rxjs/fetch';
import { isPromise } from './utils';

export const fetch = (request, init) => {
  return concat(of(undefined), fromFetch(request, init));
};

export const ajax = (...args) => {
  return concat(of(undefined), rxajax(...args));
};

export const getJSON = (...args) => {
  return concat(of(undefined), rxajax.getJSON(...args));
};

export const fetchJSON = (request, init) => {
  return concat(
    of(undefined),
    fromFetch(request, init).pipe(
      switchMap(response => {
        if (response.ok) {
          // OK return data
          return response.json();
        } else {
          // Server is returning a status requiring the client to try something else.
          return of({ error: true, message: `Error ${response.status}` });
        }
      }),
      catchError(err => {
        // Network or other error, handle appropriately
        console.error(err);
        return of({ error: true, message: err.message });
      })
    )
  );
};

export const resolve = (...args) => {
  const makeObserables = arg =>
    isPromise(arg) || isObservable(arg) ? arg : of(arg);
  return concat(...args.map(makeObserables));
};
