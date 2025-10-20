'use client'

import React, { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import { Loader2, DollarSign, Briefcase, FileText } from 'lucide-react'

interface MonthlyStats {
  earnings: number
  activeProjects: number
  applications: number
}

export function ThisMonthCard() {
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonthlyStats()
  }, [])

  const fetchMonthlyStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersApi.getMonthlyStats()

      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch monthly stats:', err)
      setError(err.message || 'Failed to load monthly stats')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Unable to load monthly stats</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">This Month</h3>
        <p className="text-xs text-gray-500">{getCurrentMonth()}</p>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {/* Earnings */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-1">Earnings</p>
            <p className="text-lg font-bold text-gray-900">
              ${stats.earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Active Projects */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-koi-orange/10 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-koi-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-1">Active Projects</p>
            <p className="text-lg font-bold text-gray-900">{stats.activeProjects}</p>
          </div>
        </div>

        {/* Applications */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-koi-teal/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-koi-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-1">Pending Applications</p>
            <p className="text-lg font-bold text-gray-900">{stats.applications}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
