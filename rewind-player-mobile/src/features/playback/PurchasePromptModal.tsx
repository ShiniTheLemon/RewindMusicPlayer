// src/features/playback/PurchasePromptModal.tsx
import { Image } from 'expo-image'
import { Linking, Modal, Pressable, Text, View } from 'react-native'
import { useServices } from '../../shared/ServicesContext'
import { Button, colors, radii, spacing, typography } from '../../shared/ui'
import { usePlaybackStore } from './playbackStore'

/**
 * §6.1. Shows when the signed-url endpoint returns 403 for the requested
 * track. Deep link goes to the marketplace artist page if we know the
 * artist's Keycloak id, else the marketplace browse page.
 */
export function PurchasePromptModal() {
  const prompt = usePlaybackStore((s) => s.purchasePrompt)
  const dismiss = usePlaybackStore((s) => s.dismissPurchasePrompt)
  const { config } = useServices()

  if (!prompt) return null
  const { track } = prompt

  const target = track.artist.keycloakId
    ? `${config.marketplaceUrl}/artists/by-user/${track.artist.keycloakId}`
    : `${config.marketplaceUrl}/browse`

  const openMarketplace = async () => {
    try {
      await Linking.openURL(target)
    } catch {
      // If Linking fails (unlikely), leave the modal up so the user can dismiss.
      return
    }
    dismiss()
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <Pressable
        onPress={dismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Image
              source={track.cover}
              style={{ width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.skeleton }}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={typography.h3}>{track.title}</Text>
              <Text numberOfLines={1} style={typography.bodySmall}>{track.artist.name}</Text>
            </View>
          </View>

          <Text style={typography.body}>
            This track isn’t in your collection. Buy it on the marketplace and it will unlock
            here instantly.
          </Text>

          <View style={{ gap: spacing.sm }}>
            <Button
              title="Open marketplace"
              icon="open-outline"
              fullWidth
              onPress={openMarketplace}
            />
            <Button title="Not now" variant="ghost" fullWidth onPress={dismiss} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
