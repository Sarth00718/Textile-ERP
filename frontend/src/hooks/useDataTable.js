import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Centralizes the list-page state pattern used by every module:
 * pagination, debounced search, and arbitrary filter params, plus a
 * fetcher call whenever any of those change.
 *
 * fetcher: async (params) => { items, meta }
 */
export function useDataTable(fetcher, initialFilters = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const debounceRef = useRef(null);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, pageSize: 20, search: search || undefined, ...filters, ...overrides };
      const res = await fetcher(params);
      setItems(res.items || res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load data');
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, JSON.stringify(filters)]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, JSON.stringify(filters)]);

  function handleSearch(value) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load({ search: value, page: 1 });
    }, 350);
  }

  function updateFilters(next) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next }));
  }

  return {
    items, meta, loading, error, page, search, filters,
    setPage, handleSearch, updateFilters, reload: load,
  };
}
