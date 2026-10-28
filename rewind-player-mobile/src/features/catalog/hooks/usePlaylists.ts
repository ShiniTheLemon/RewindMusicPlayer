// src/features/catalog/hooks/usePlaylists.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPlaylist, loadPlaylists } from '../../../core/application/playlists'
import type { Track } from '../../../core/domain/entities'
import { useServices } from '../../../shared/ServicesContext'

export function usePlaylists() {
  const services = useServices()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['playlists'],
    queryFn: () => loadPlaylists(services.api),
  })

  const create = useMutation({
    mutationFn: (args: { name: string; tracks: readonly Track[] }) =>
      createPlaylist(services.api, args.name, args.tracks),
    onSettled: () => qc.invalidateQueries({ queryKey: ['playlists'] }),
  })

  return {
    ...query,
    /** Creates a playlist with the given tracks; resolves with the summary + failed ids. */
    create: (name: string, tracks: readonly Track[]) =>
      create.mutateAsync({ name, tracks }),
    creating: create.isPending,
  }
}
