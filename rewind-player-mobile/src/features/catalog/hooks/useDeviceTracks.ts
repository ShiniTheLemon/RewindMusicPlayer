// src/features/catalog/hooks/useDeviceTracks.ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useServices } from '../../../shared/ServicesContext'
import { deviceTrackToTrack } from '../../../core/application/deviceMusic'
import type { Track } from '../../../core/domain/entities'

const PAGE_SIZE = 50

/**
 * Device music library (MediaStore / MPMediaQuery) behind the
 * DeviceMusicSource port. Permission is requested lazily from the UI.
 */
export function useDeviceTracks() {
  const services = useServices()
  const qc = useQueryClient()
  const source = services.deviceMusic

  const permission = useQuery({
    queryKey: ['deviceMusicPermission'],
    queryFn: () => source.getPermission(),
  })

  const requestPermission = useMutation({
    mutationFn: () => source.requestPermission(),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['deviceMusicPermission'] }),
  })

  const pages = useInfiniteQuery({
    queryKey: ['deviceTracks'],
    queryFn: ({ pageParam }) => source.listTracks(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastPageParam) =>
      last.hasMore ? lastPageParam + PAGE_SIZE : undefined,
    enabled: permission.data === true,
  })

  const tracks: Track[] = (pages.data?.pages ?? []).flatMap((p) =>
    p.tracks
      .filter((t) => !t.drmProtected || t.uri != null)
      .map((t) => deviceTrackToTrack(t, services.normalizeOpts.staticCover)),
  )
  const allPages = pages.data?.pages ?? []
  const hasMore = allPages.length > 0 ? allPages[allPages.length - 1]!.hasMore : false

  return {
    granted: permission.data === true,
    isLoading: pages.isLoading,
    tracks,
    hasMore,
    error: pages.error ? String(pages.error) : null,
    loadMore: () => {
      if (pages.hasNextPage && !pages.isFetchingNextPage) {
        void pages.fetchNextPage()
      }
    },
    requestPermission: () => requestPermission.mutate(),
  }
}
