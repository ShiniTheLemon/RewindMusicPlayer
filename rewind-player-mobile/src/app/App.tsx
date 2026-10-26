// src/app/App.tsx
import { useMemo } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { ServicesProvider } from '../shared/ServicesContext'
import { createQueryClient } from './queryClient'
import { loadConfig } from './config'
import { createServices } from './services'
import { Navigation } from './navigation'
import { PlayerModal } from '../features/playback/PlayerModal'
import { BufferingOverlay } from '../features/playback/BufferingOverlay'
import { PurchasePromptModal } from '../features/playback/PurchasePromptModal'
export default function App() {
  const queryClient = useMemo(() => createQueryClient(), [])
  const services = useMemo(() => createServices(loadConfig()), [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ServicesProvider services={services}>
            <StatusBar style="dark" />
            <Navigation />
            <PlayerModal />
            <BufferingOverlay />
            <PurchasePromptModal />
          </ServicesProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
