// src/features/catalog/hooks/useStakes.ts
import { useQuery } from '@tanstack/react-query'
import { resolveStakes } from '../../../core/application/stakes'
import { useServices } from '../../../shared/ServicesContext'
import { useCatalog } from '../../catalog/hooks/useCatalog'

export function useStakes() {
  const services = useServices()
  const catalog = useCatalog()
  return useQuery({
    queryKey: ['stakes'],
    queryFn: () =>
      resolveStakes(services.api, services.normalizeOpts, {
        artistMap: catalog.data!.artistMap,
        albumMap: catalog.data!.albumMap,
      }),
    enabled: Boolean(catalog.data),
  })
}
