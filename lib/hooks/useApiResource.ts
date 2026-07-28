"use client";

import { useEffect, useRef, useState } from "react";

export interface ApiResourceState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

export function useApiResource<T>(url: string | null): ApiResourceState<T> {
  const [state, setState] = useState<ApiResourceState<T>>({ data: null, loading: Boolean(url), error: false });
  const requestId = useRef(0);

  useEffect(() => {
    if (!url) return;
    const id = ++requestId.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off the fetch this effect exists for
    setState({ data: null, loading: true, error: false });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (requestId.current === id) setState({ data, loading: false, error: false });
      })
      .catch(() => {
        if (requestId.current === id) setState({ data: null, loading: false, error: true });
      });
  }, [url]);

  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    if (!url) setState({ data: null, loading: false, error: false });
  }

  return state;
}
