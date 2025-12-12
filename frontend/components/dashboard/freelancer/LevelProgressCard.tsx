'use client'

import React, { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import { Loader2, TrendingUp, Award } from 'lucide-react'

interface LevelData {
  currentLevel: string
  nextLevel: string
  progress: number
  metrics: {
    completedProjects: number
    successRate: number
    responseTime: string
    completionRate: number
  }
}

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Elite':
      return 'from-purple-500 to-purple-700'
    case 'Top Rated':
      return 'from-koi-gold to-yellow-600'
    case 'Rising Star':
      return 'from-koi-teal to-teal-600'
    default:
      return 'from-gray-400 to-gray-600'
  }
}

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'Elite':
      return '👑'
    case 'Top Rated':
      return '⭐'
    case 'Rising Star':
      return '🚀'
    default:
      return '🌱'
  }
}

export function LevelProgressCard() {
  const [levelData, setLevelData] = useState<LevelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLevelProgress()
  }, [])

  const fetchLevelProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersApi.getLevelProgress()

      if (response.success && response.data) {
        setLevelData(response.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch level progress:', err)
      setError(err.message || 'Failed to load level progress')
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

  if (error || !levelData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Unable to load level progress</p>
        </div>
      </div>
    )
  }

  const isMaxLevel = levelData.currentLevel === levelData.nextLevel

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Metrics</h3>

      {/* Metrics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Completed Projects</span>
          <span className="text-sm font-semibold text-gray-900">{levelData.metrics.completedProjects}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Success Rate</span>
          <span className="text-sm font-semibold text-green-600">{levelData.metrics.successRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Response Time</span>
          <span className="text-sm font-semibold text-gray-900">{levelData.metrics.responseTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Completion Rate</span>
          <span className="text-sm font-semibold text-blue-600">{levelData.metrics.completionRate}%</span>
        </div>
      </div>
    </div>
  )
}
