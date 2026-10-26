// src/features/catalog/hooks/useCatalog.ts
import { useQuery } from '@tanstack/react-query'
import { fetchCatalog } from '../../../core/application/catalog'
import { useServices } from '../../../shared/ServicesContext'

export function useCatalog() {
  const services = useServices()
  return useQuery({
    queryKey: ['catalog'],
    queryFn: () => fetchCatalog(services.api, services.normalizeOpts),
    staleTime: 5 * 60_000,
  })
}
