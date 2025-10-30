'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { NetworkMonitor } from '@/lib/utils/apiErrorHandler'
import { WifiOff, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5003'

interface NetworkStatusContextType {
  isOnline: boolean
  isConnecting: boolean
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  isConnecting: false
})

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext)
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider')
  }
  return context
}

interface NetworkStatusProviderProps {
  children: React.ReactNode
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(false) // Start as false until we verify
  const [isConnecting, setIsConnecting] = useState(true) // Start as connecting

  useEffect(() => {
    // Initialize network monitoring
    const cleanup = NetworkMonitor.initialize()

    // Test initial connectivity on mount
    const testInitialConnectivity = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          setIsOnline(true)
          setIsConnecting(false)
        } else {
          setIsOnline(false)
          setIsConnecting(false)
        }
      } catch (error) {
        console.log('Initial connectivity test failed:', error)
        setIsOnline(false)
        setIsConnecting(false)
      }
    }

    testInitialConnectivity()

    // Custom handlers for more detailed feedback
    const handleOnline = () => {
      setIsConnecting(true)

      // Test actual connectivity, not just network interface
      fetch(`${API_BASE_URL}/health`, {
        method: 'HEAD',
        cache: 'no-cache'
      })
      .then(() => {
        setIsOnline(true)
        setIsConnecting(false)
        toast.success('Connection restored!', {
          icon: <Wifi className="w-4 h-4" />,
          duration: 3000
        })
      })
      .catch(() => {
        // Network interface is up but no internet
        setIsOnline(false)
        setIsConnecting(false)
        toast.error('Limited connectivity detected', {
          icon: <WifiOff className="w-4 h-4" />,
          duration: 5000
        })
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsConnecting(false)
      toast.error('You appear to be offline', {
        icon: <WifiOff className="w-4 h-4" />,
        duration: 0, // Don't auto-dismiss
        style: {
          background: '#DC2626',
          color: '#fff'
        }
      })
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // TEMPORARILY DISABLED - causing 429 rate limit errors
    // Periodic connectivity check (every 30 seconds when online)
    // let connectivityCheckInterval: NodeJS.Timeout | null = null

    // const startConnectivityCheck = () => {
    //   connectivityCheckInterval = setInterval(async () => {
    //     if (isOnline) {
    //       try {
    //         const response = await fetch(`${API_BASE_URL}/health`, {
    //           method: 'HEAD',
    //           cache: 'no-cache',
    //           signal: AbortSignal.timeout(5000) // 5 second timeout
    //         })

    //         if (!response.ok) {
    //           throw new Error('Server unreachable')
    //         }
    //       } catch (error) {
    //         // Connection lost
    //         setIsOnline(false)
    //         toast.error('Connection lost', {
    //           icon: <WifiOff className="w-4 h-4" />,
    //           duration: 0
    //         })
    //       }
    //     }
    //   }, 30000) // Check every 30 seconds
    // }

    // startConnectivityCheck()

    return () => {
      cleanup?.()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      // if (connectivityCheckInterval) {
      //   clearInterval(connectivityCheckInterval)
      // }
    }
  }, [isOnline])

  const value: NetworkStatusContextType = {
    isOnline,
    isConnecting
  }

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
      {/* Offline indicator */}
      {!isOnline && !isConnecting && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">You're offline</p>
              <p className="text-xs text-red-100">Some features may not work properly</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Connecting indicator */}
      {isConnecting && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
          <div className="bg-yellow-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Reconnecting...</p>
              <p className="text-xs text-yellow-100">Checking connection status</p>
            </div>
          </div>
        </div>
      )}
    </NetworkStatusContext.Provider>
  )
}

// Component to show network-dependent content
interface OnlineOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function OnlineOnly({ children, fallback }: OnlineOnlyProps) {
  const { isOnline } = useNetworkStatus()
  
  if (!isOnline) {
    return fallback || (
      <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Offline</h3>
        <p className="text-gray-600">This feature requires an internet connection.</p>
      </div>
    )
  }
  
  return <>{children}</>
}

// Hook for components that need to handle offline scenarios
export function useOfflineDetection() {
  const { isOnline } = useNetworkStatus()
  const [offlineActions, setOfflineActions] = useState<Array<() => void>>([])

  const queueOfflineAction = (action: () => void) => {
    if (isOnline) {
      action()
    } else {
      setOfflineActions(prev => [...prev, action])
      toast.error('Action queued for when you\'re back online', {
        duration: 3000
      })
    }
  }

  // Execute queued actions when coming back online
  useEffect(() => {
    if (isOnline && offlineActions.length > 0) {
      toast.success(`Executing ${offlineActions.length} queued action(s)`, {
        duration: 3000
      })
      
      offlineActions.forEach(action => {
        try {
          action()
        } catch (error) {
          console.error('Error executing offline action:', error)
        }
      })
      
      setOfflineActions([])
    }
  }, [isOnline, offlineActions])

  return {
    isOnline,
    queueOfflineAction,
    hasQueuedActions: offlineActions.length > 0
  }
}