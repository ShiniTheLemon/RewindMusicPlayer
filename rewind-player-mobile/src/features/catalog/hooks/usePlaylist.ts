// src/features/catalog/hooks/usePlaylist.ts
import { useQuery } from '@tanstack/react-query'
import { loadPlaylist } from '../../../core/application/playlists'
import { useServices } from '../../../shared/ServicesContext'
import { useCatalog } from '../../catalog/hooks/useCatalog'

export function usePlaylist(id: string) {
  const services = useServices()
  const catalog = useCatalog()
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () =>
      loadPlaylist(services.api, id, services.normalizeOpts, {
        artistMap: catalog.data!.artistMap,
        albumMap: catalog.data!.albumMap,
      }),
    enabled: Boolean(id) && Boolean(catalog.data),
  })
}
