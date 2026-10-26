// src/features/catalog/hooks/useSearch.ts
import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchCatalog } from '../../../core/application/search'
import { useServices } from '../../../shared/ServicesContext'
import { useCatalog } from '../../catalog/hooks/useCatalog'

export function useSearch(query: string) {
  const services = useServices()
  const catalog = useCatalog()
  const debounced = useDebounce(query.trim(), 300)

  return useQuery({
    queryKey: ['search', debounced],
    queryFn: () =>
      searchCatalog(
        services.api,
        debounced,
        services.normalizeOpts,
        catalog.data
          ? { artistMap: catalog.data.artistMap, albumMap: catalog.data.albumMap }
          : undefined,
      ),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
  })
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
