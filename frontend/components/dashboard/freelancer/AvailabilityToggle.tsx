'use client'

import React, { useState, useEffect } from 'react'
import { usersApi } from '@/lib/api/users'
import { useAuthStore } from '@/lib/store/authStore'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export function AvailabilityToggle() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.isAvailable !== undefined) {
      setIsAvailable(user.isAvailable)
    }
  }, [user?.isAvailable])

  const handleToggle = async () => {
    const newValue = !isAvailable

    // Optimistic update
    setIsAvailable(newValue)
    setError(null)

    try {
      setLoading(true)
      const response = await usersApi.updateAvailability(newValue)

      if (response.success && response.isAvailable !== undefined) {
        // Update auth store
        updateUser({ isAvailable: response.isAvailable })
        setIsAvailable(response.isAvailable)
      } else {
        throw new Error('Failed to update availability')
      }
    } catch (err: any) {
      console.error('Failed to update availability:', err)
      setError(err.message || 'Failed to update availability')
      // Revert optimistic update
      setIsAvailable(!newValue)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Availability Status</h3>
        <p className="text-xs text-gray-500">
          Control your visibility to potential clients
        </p>
      </div>

      {/* Toggle Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isAvailable ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
          <span className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-gray-600'}`}>
            {isAvailable ? 'Available for Work' : 'Unavailable'}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-koi-orange focus:ring-offset-2 ${
            isAvailable ? 'bg-green-600' : 'bg-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          {loading && (
            <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-gray-600" />
          )}
        </button>
      </div>

      {/* Status Description */}
      <div className={`text-xs p-3 rounded-lg ${
        isAvailable
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-gray-50 border border-gray-200 text-gray-600'
      }`}>
        {isAvailable ? (
          <p>Your profile is visible and clients can send you project invitations.</p>
        ) : (
          <p>Your profile is hidden from search results and project recommendations.</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  )
}
