// src/features/catalog/hooks/usePlaylists.ts
import { useQuery } from '@tanstack/react-query'
import { loadPlaylists } from '../../../core/application/playlists'
import { useServices } from '../../../shared/ServicesContext'

export function usePlaylists() {
  const services = useServices()
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => loadPlaylists(services.api),
  })
}
