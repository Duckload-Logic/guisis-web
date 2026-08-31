import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

let currentParamsRef: URLSearchParams | null = null;
let timeoutRef: ReturnType<typeof setTimeout> | null = null;

/**
 * A hook that works like useState but syncs the state with the URL query parameters.
 * @param key The URL query parameter key
 * @param defaultValue The default value if the query parameter is not present
 */
export function useUrlState<T>(
  key: string,
  defaultValue: T,
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    const rawValue = searchParams.get(key);
    if (rawValue === null) return defaultValue;

    try {
      if (typeof defaultValue === 'number') return Number(rawValue) as T;
      if (typeof defaultValue === 'boolean') return (rawValue === 'true') as T;
      if (typeof defaultValue === 'object') return JSON.parse(rawValue) as T;
      return rawValue as unknown as T;
    } catch {
      return defaultValue;
    }
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setSearchParams(
        (prevParams) => {
          const baseParams = currentParamsRef || prevParams;
          const params = new URLSearchParams(baseParams);
          const valToSet =
            typeof newValue === 'function'
              ? (newValue as (prev: T) => T)(value)
              : newValue;

          const isDefault =
            valToSet === defaultValue ||
            (typeof valToSet === 'object' &&
              JSON.stringify(valToSet) === JSON.stringify(defaultValue));

          if (
            isDefault ||
            valToSet === null ||
            valToSet === undefined ||
            valToSet === ''
          ) {
            params.delete(key);
          } else {
            const stringVal =
              typeof valToSet === 'object'
                ? JSON.stringify(valToSet)
                : String(valToSet);
            params.set(key, stringVal);
          }

          currentParamsRef = params;
          if (!timeoutRef) {
            timeoutRef = setTimeout(() => {
              currentParamsRef = null;
              timeoutRef = null;
            }, 0);
          }

          return params;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setSearchParams, value]
  );

  return [value, setValue];
}
