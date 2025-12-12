'use client'

import React, { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import { Loader2, Briefcase, CheckCircle, Star, TrendingUp } from 'lucide-react'

interface DashboardStats {
  activeProjects: number
  totalEarnings: number
  rating: number
  completedProjects: number
}

export function QuickStatsCard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getDashboardStats()

      if (response.success && response.stats) {
        setStats(response.stats)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-koi-orange" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>

      <div className="space-y-4">
        {/* Active Projects */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Projects</p>
              <p className="text-lg font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-lg font-bold text-gray-900">{stats.completedProjects}</p>
            </div>
          </div>
        </div>

        {/* Rating */}
        {stats.rating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 fill-current" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Rating</p>
                <p className="text-lg font-bold text-gray-900">{stats.rating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Rate (derived from completed vs total) */}
        {stats.completedProjects > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>Keep up the great work!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
