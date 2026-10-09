'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage, apiFetch } from '@/lib/api-client';

interface ApiDataState<T> {
  data: T | null;
  error: string;
  loading: boolean;
}

/**
 * Loads JSON from a GET endpoint with loading and error state.
 * `reload()` refetches (e.g. after the user changes something).
 */
export function useApiData<T>(
  path: string,
  select: (json: unknown) => T,
  errorMessage: string,
  /** Refetch when this changes (e.g. the signed-in user) */
  cacheKey = ''
) {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, error: '', loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    apiFetch(path)
      .then(async (res) =>
        res.ok
          ? { data: select(await res.json()), error: '' }
          : { data: null, error: await apiErrorMessage(res, errorMessage) }
      )
      .catch(() => ({ data: null, error: 'Connection problem. Check your internet and try again.' }))
      .then((result) => {
        if (!ignore) setState({ ...result, loading: false });
      });
    return () => {
      ignore = true;
    };
    // `select` and `errorMessage` are treated as constants for a given path
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version, cacheKey]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: s.data === null }));
    setVersion((v) => v + 1);
  }, []);

  return { ...state, reload };
}
