'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'

export function ProfileCard() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  if (!user) return null

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  const handleViewProfile = () => {
    router.push(`/profile/${user.username}`)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="relative mb-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-20 h-20 rounded-full object-cover border-2 border-koi-orange"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-koi-orange to-koi-teal flex items-center justify-center text-white text-2xl font-bold border-2 border-koi-orange">
              {getInitials()}
            </div>
          )}
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-koi-teal rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-sm text-gray-500">@{user.username}</p>

        {/* Rating */}
        {user.rating && user.rating > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-koi-gold text-koi-gold" />
            <span className="text-sm font-semibold text-gray-900">
              {user.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* View Profile Button */}
      <button
        onClick={handleViewProfile}
        className="w-full py-2 px-4 bg-koi-orange text-white rounded-lg font-medium hover:bg-koi-orange/90 transition-colors"
      >
        View Public Profile
      </button>
    </div>
  )
}
