import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityGetResponse } from '@uipath/uipath-typescript/entities';
export function useEntities() {
  const { sdk, isAuthenticated } = useAuth();
  const entities = useMemo(() => (sdk ? new Entities(sdk) : null), [sdk]);
  const [data, setData] = useState<EntityGetResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchEntities = useCallback(async () => {
    if (!entities || !isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await entities.getAll();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load entities');
    } finally {
      setIsLoading(false);
    }
  }, [entities, isAuthenticated]);
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);
  return {
    entities: data,
    isLoading,
    error,
    refetch: fetchEntities,
  };
}