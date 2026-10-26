// src/features/catalog/hooks/useFavorites.ts
import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Track } from '../../../core/domain/entities'
import { useServices } from '../../../shared/ServicesContext'

export function useFavorites() {
  const services = useServices()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: () => services.favorites.load(),
  })

  const ids = useMemo(() => new Set(query.data?.ids ?? []), [query.data])

  const addMutation = useMutation({
    mutationFn: (args: { trackId: string; track?: Track }) =>
      services.favorites.add(args.trackId, args.track),
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (trackId: string) => services.favorites.remove(trackId),
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const toggle = useCallback(
    async (trackId: string, track?: Track) => {
      if (ids.has(trackId)) await removeMutation.mutateAsync(trackId)
      else await addMutation.mutateAsync({ trackId, track })
    },
    [ids, addMutation, removeMutation],
  )

  return {
    query,
    isFavorite: (trackId: string) => ids.has(trackId),
    toggle,
  }
}
