'use client'

import React, { useState } from 'react'
import {
  X,
  Menu
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { FreelancerSidebar } from './freelancer/FreelancerSidebar'
import { ProfileCard } from './freelancer/ProfileCard'
import { LevelProgressCard } from './freelancer/LevelProgressCard'
import { AvailabilityToggle } from './freelancer/AvailabilityToggle'
import { StripeConnectAlert } from '@/components/stripe/StripeConnectAlert'
import { HeroSection } from '@/components/freelancer/HeroSection'
import { OpportunitiesSection } from '@/components/freelancer/OpportunitiesSection'
import { ActionBanner } from './ActionBanner'
import ActiveWorkSection from './ActiveWorkSection'

export function FreelancerDashboard() {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Desktop */}
      <FreelancerSidebar />

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProfileCard />
            <LevelProgressCard />
            <AvailabilityToggle />
          </div>
        </div>
      )}

      {/* Main Content - With left margin on desktop */}
      <div className="lg:ml-[280px] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>

          {/* Stripe Connect Alert */}
          <StripeConnectAlert
            stripeConnectAccountId={user?.stripeConnectAccountId}
            stripePayoutsEnabled={user?.stripePayoutsEnabled}
          />

          {/* Action Banner */}
          <ActionBanner />

          {/* Hero Section */}
          <HeroSection firstName={user?.firstName} />

          {/* Opportunities Section */}
          <OpportunitiesSection />

          {/* Active Work Section (Projects & Services) */}
          <ActiveWorkSection userId={user?.id || ''} />
        </div>
      </div>
    </div>
  )
}
